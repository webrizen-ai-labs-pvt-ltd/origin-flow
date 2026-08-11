import crypto from "crypto";

export interface PhonePePaymentParams {
  merchantTransactionId: string;
  merchantUserId: string;
  amountInPaise: number;
  mobileNumber?: string;
  redirectUrl?: string;
}

export interface PhonePeInitiateResult {
  success: boolean;
  merchantTransactionId: string;
  redirectUrl?: string;
  code?: string;
  message?: string;
  data?: any;
}

export interface PhonePeStatusResult {
  success: boolean;
  code: string;
  message: string;
  data?: {
    merchantId: string;
    merchantTransactionId: string;
    transactionId?: string;
    amount: number;
    state: "COMPLETED" | "FAILED" | "PENDING";
    responseCode: string;
    paymentInstrument?: {
      type: string;
      [key: string]: any;
    };
  };
}

export class PhonePeService {
  private static get config() {
    return {
      baseUrl: process.env["PHONEPE_BASE_URL"] || "https://api-preprod.phonepe.com/apis/pg-sandbox",
      merchantId: process.env["PHONEPE_MERCHANT_ID"] || "PGTESTPAYUAT86",
      saltKey: process.env["PHONEPE_SALT_KEY"] || "96434309-7796-489d-8924-ab56988a6076",
      saltIndex: process.env["PHONEPE_SALT_INDEX"] || "1",
      callbackUrl:
        process.env["PHONEPE_CALLBACK_URL"] ||
        "http://localhost:4000/api/subscriptions/phonepe/webhook",
      returnUrl:
        process.env["FRONTEND_RETURN_URL"] || "http://localhost:3001/dashboard/plans",
    };
  }

  /**
   * Generates SHA256 checksum for PhonePe API requests
   */
  public static generateChecksum(base64Payload: string, apiEndpoint: string): string {
    const { saltKey, saltIndex } = this.config;
    const stringToHash = base64Payload + apiEndpoint + saltKey;
    const sha256 = crypto.createHash("sha256").update(stringToHash).digest("hex");
    return `${sha256}###${saltIndex}`;
  }

  /**
   * Verifies PhonePe S2S webhook signature
   */
  public static verifyWebhookSignature(base64Response: string, xVerifyHeader: string): boolean {
    const { saltKey, saltIndex } = this.config;
    const stringToHash = base64Response + saltKey;
    const expectedHash = crypto.createHash("sha256").update(stringToHash).digest("hex");
    const expectedXVerify = `${expectedHash}###${saltIndex}`;
    return expectedXVerify === xVerifyHeader;
  }

  /**
   * Initiates payment order on PhonePe PG (/pg/v1/pay)
   */
  public static async initiatePayment(params: PhonePePaymentParams): Promise<PhonePeInitiateResult> {
    const { baseUrl, merchantId, callbackUrl, returnUrl } = this.config;
    const apiEndpoint = "/pg/v1/pay";

    const payload = {
      merchantId,
      merchantTransactionId: params.merchantTransactionId,
      merchantUserId: params.merchantUserId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 36),
      amount: params.amountInPaise,
      redirectUrl: params.redirectUrl || returnUrl,
      redirectMode: "REDIRECT",
      callbackUrl,
      mobileNumber: params.mobileNumber ? params.mobileNumber.replace(/\D/g, "").slice(-10) : undefined,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
    const xVerify = this.generateChecksum(base64Payload, apiEndpoint);

    try {
      const response = await fetch(`${baseUrl}${apiEndpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": xVerify,
        },
        body: JSON.stringify({ request: base64Payload }),
      });

      const json = (await response.json()) as any;

      if (json.success && json.data?.instrumentResponse?.redirectInfo?.url) {
        return {
          success: true,
          merchantTransactionId: params.merchantTransactionId,
          redirectUrl: json.data.instrumentResponse.redirectInfo.url,
          data: json.data,
        };
      }

      return {
        success: false,
        merchantTransactionId: params.merchantTransactionId,
        code: json.code,
        message: json.message || "Failed to get payment redirect URL from PhonePe",
        data: json,
      };
    } catch (error: any) {
      console.error("PhonePe initiatePayment error:", error);
      return {
        success: false,
        merchantTransactionId: params.merchantTransactionId,
        message: error.message || "Network error while connecting to PhonePe",
      };
    }
  }

  /**
   * Queries PhonePe order status (/pg/v1/status/{merchantId}/{merchantTransactionId})
   */
  public static async checkStatus(merchantTransactionId: string): Promise<PhonePeStatusResult> {
    const { baseUrl, merchantId, saltKey, saltIndex } = this.config;
    const apiEndpoint = `/pg/v1/status/${merchantId}/${merchantTransactionId}`;

    const stringToHash = apiEndpoint + saltKey;
    const sha256 = crypto.createHash("sha256").update(stringToHash).digest("hex");
    const xVerify = `${sha256}###${saltIndex}`;

    try {
      const response = await fetch(`${baseUrl}${apiEndpoint}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": xVerify,
          "X-MERCHANT-ID": merchantId,
        },
      });

      const json = (await response.json()) as PhonePeStatusResult;
      return json;
    } catch (error: any) {
      console.error("PhonePe checkStatus error:", error);
      return {
        success: false,
        code: "NETWORK_ERROR",
        message: error.message || "Failed to query PhonePe transaction status",
      };
    }
  }
}
