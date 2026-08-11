import type { Request, Response } from "express";
import crypto from "crypto";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { prisma } from "../db.js";
import { Role, BillingCycle, SubscriptionStatus, PaymentStatus, type Prisma } from "@prisma/client";
import { PhonePeService } from "../services/phonepe.service.js";
import {
  sendPaymentSuccessEmail,
  sendPaymentFailedEmail,
} from "../services/mailer.service.js";

/**
 * Initiates a PhonePe checkout order for a subscription plan
 */
export const initiateCheckout = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (user.role !== Role.COMPANY) {
      return res.status(403).json({ error: "Only accounts with COMPANY role can purchase subscription plans" });
    }

    const { planId, redirectUrl } = req.body;

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) {
      return res.status(404).json({ error: "Selected plan is not available" });
    }

    // Generate unique transaction ID
    const randomSuffix = crypto.randomBytes(4).toString("hex").toUpperCase();
    const merchantTransactionId = `OF_${Date.now()}_${randomSuffix}`;

    // Record initiated transaction in DB
    await prisma.paymentTransaction.create({
      data: {
        merchantTransactionId,
        companyId: user.id,
        planId: plan.id,
        amount: plan.price,
        currency: plan.currency,
        status: PaymentStatus.INITIATED,
      },
    });

    // Ensure redirectUrl has merchantTransactionId attached for seamless frontend verification
    const targetRedirectUrl = redirectUrl
      ? `${redirectUrl}${redirectUrl.includes("?") ? "&" : "?"}txn=${merchantTransactionId}`
      : undefined;

    // Call PhonePe Payment Gateway
    const phonepeRes = await PhonePeService.initiatePayment({
      merchantTransactionId,
      merchantUserId: user.id,
      amountInPaise: plan.price,
      mobileNumber: user.phone || undefined,
      redirectUrl: targetRedirectUrl,
    });

    if (!phonepeRes.success || !phonepeRes.redirectUrl) {
      await prisma.paymentTransaction.update({
        where: { merchantTransactionId },
        data: {
          status: PaymentStatus.FAILED,
          responseCode: phonepeRes.code || "INITIATE_FAILED",
          rawCallbackPayload: phonepeRes.data || {},
        },
      });

      return res.status(502).json({
        error: phonepeRes.message || "Failed to initiate payment with PhonePe gateway",
        details: phonepeRes,
      });
    }

    res.json({
      success: true,
      merchantTransactionId,
      redirectUrl: phonepeRes.redirectUrl,
    });
  } catch (error) {
    console.error("Error initiating checkout:", error);
    res.status(500).json({ error: "Internal server error during checkout initiation" });
  }
};

/**
 * Handles PhonePe Server-to-Server (S2S) Webhook callback
 */
export const handlePhonePeWebhook = async (req: Request, res: Response) => {
  try {
    const xVerifyHeader = req.headers["x-verify"] as string;
    const { response: base64Response } = req.body;

    if (!base64Response || !xVerifyHeader) {
      console.warn("⚠️ PhonePe webhook missing payload or X-VERIFY header");
      return res.status(400).json({ error: "Missing required payload or signature" });
    }

    // Verify webhook signature
    const isValidSignature = PhonePeService.verifyWebhookSignature(base64Response, xVerifyHeader);
    if (!isValidSignature) {
      console.error("❌ Invalid PhonePe webhook signature mismatch!");
      return res.status(401).json({ error: "Invalid signature checksum" });
    }

    // Decode and parse payload
    const decodedJson = JSON.parse(Buffer.from(base64Response, "base64").toString("utf-8"));
    const { success, code, data } = decodedJson;
    const { merchantTransactionId, transactionId, paymentInstrument } = data || {};

    if (!merchantTransactionId) {
      return res.status(400).json({ error: "merchantTransactionId missing from payload" });
    }

    // Lookup transaction
    const transaction = await prisma.paymentTransaction.findUnique({
      where: { merchantTransactionId },
      include: {
        plan: true,
        company: {
          include: { companyProfile: true },
        },
      },
    });

    if (!transaction) {
      console.error(`Transaction ${merchantTransactionId} not found in DB`);
      return res.status(404).json({ error: "Transaction not found" });
    }

    // Idempotency: if already processed, return 200 OK
    if (transaction.status === PaymentStatus.SUCCESS) {
      return res.json({ success: true, message: "Transaction already processed" });
    }

    // Query PhonePe status API for double verification
    const statusCheck = await PhonePeService.checkStatus(merchantTransactionId);
    const isCompleted =
      statusCheck.success &&
      (statusCheck.code === "PAYMENT_SUCCESS" || statusCheck.data?.state === "COMPLETED");

    if (isCompleted) {
      const plan = transaction.plan;
      const companyUser = transaction.company;

      // Calculate period end based on plan cycle
      let durationDays = 30;
      switch (plan.billingCycle) {
        case BillingCycle.MONTHLY:
          durationDays = 30;
          break;
        case BillingCycle.QUARTERLY:
          durationDays = 90;
          break;
        case BillingCycle.YEARLY:
          durationDays = 365;
          break;
        case BillingCycle.LIFETIME:
          durationDays = 3650;
          break;
      }

      const now = new Date();
      const currentPeriodEnd = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

      // Cancel previous active subscriptions for this company
      await prisma.subscription.updateMany({
        where: {
          companyId: transaction.companyId,
          status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
        },
        data: { status: SubscriptionStatus.CANCELED },
      });

      // Create new active subscription
      const subscription = await prisma.subscription.create({
        data: {
          companyId: transaction.companyId,
          planId: transaction.planId,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: now,
          currentPeriodEnd,
          assignedByAdmin: false,
        },
      });

      // Update transaction record
      await prisma.paymentTransaction.update({
        where: { merchantTransactionId },
        data: {
          status: PaymentStatus.SUCCESS,
          phonePeTransactionId: transactionId || statusCheck.data?.transactionId,
          subscriptionId: subscription.id,
          paymentMode: paymentInstrument?.type || statusCheck.data?.paymentInstrument?.type,
          responseCode: code || "SUCCESS",
          rawCallbackPayload: decodedJson,
        },
      });

      // Send payment confirmation email asynchronously
      sendPaymentSuccessEmail({
        to: companyUser.email,
        name: companyUser.name || companyUser.companyProfile?.companyName || "Organization Admin",
        planName: plan.name,
        amountInPaise: transaction.amount,
        billingCycle: plan.billingCycle,
        validUntil: currentPeriodEnd,
        transactionId: merchantTransactionId,
      });

      console.log(`✅ Subscription activated for company ${transaction.companyId} (Plan: ${plan.name})`);
    } else {
      // Payment Failed
      await prisma.paymentTransaction.update({
        where: { merchantTransactionId },
        data: {
          status: PaymentStatus.FAILED,
          phonePeTransactionId: transactionId,
          responseCode: code || "PAYMENT_FAILED",
          rawCallbackPayload: decodedJson,
        },
      });

      sendPaymentFailedEmail({
        to: transaction.company.email,
        name: transaction.company.name || "Organization Admin",
        planName: transaction.plan.name,
        amountInPaise: transaction.amount,
        transactionId: merchantTransactionId,
        reason: decodedJson.message || "Payment was rejected or cancelled",
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error processing PhonePe webhook:", error);
    res.status(500).json({ error: "Internal server error processing webhook" });
  }
};

/**
 * Polling/Status check endpoint for frontend verification after user return
 */
export const verifyTransactionStatus = async (req: AuthRequest, res: Response) => {
  try {
    const merchantTransactionId = req.params["merchantTransactionId"] as string;

    const transaction = await prisma.paymentTransaction.findUnique({
      where: { merchantTransactionId },
      include: {
        plan: true,
        subscription: true,
        company: {
          include: {
            companyProfile: true,
          },
        },
      },
    });

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // If still initiated/pending, query PhonePe directly
    if (transaction.status === PaymentStatus.INITIATED || transaction.status === PaymentStatus.PENDING) {
      const statusCheck = await PhonePeService.checkStatus(merchantTransactionId);

      if (statusCheck.success && statusCheck.code === "PAYMENT_SUCCESS") {
        // Trigger fulfillment if webhook was delayed or running on localhost
        const plan = transaction.plan;
        const now = new Date();
        const durationDays =
          plan.billingCycle === BillingCycle.YEARLY
            ? 365
            : plan.billingCycle === BillingCycle.QUARTERLY
            ? 90
            : plan.billingCycle === BillingCycle.LIFETIME
            ? 3650
            : 30;
        const currentPeriodEnd = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

        await prisma.subscription.updateMany({
          where: {
            companyId: transaction.companyId,
            status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
          },
          data: { status: SubscriptionStatus.CANCELED },
        });

        const subscription = await prisma.subscription.create({
          data: {
            companyId: transaction.companyId,
            planId: transaction.planId,
            status: SubscriptionStatus.ACTIVE,
            currentPeriodStart: now,
            currentPeriodEnd,
          },
        });

        const updatedTxn = await prisma.paymentTransaction.update({
          where: { merchantTransactionId },
          data: {
            status: PaymentStatus.SUCCESS,
            phonePeTransactionId: statusCheck.data?.transactionId,
            subscriptionId: subscription.id,
            paymentMode: statusCheck.data?.paymentInstrument?.type || "PhonePe PG (UPI/Cards)",
            responseCode: statusCheck.code,
            rawCallbackPayload: statusCheck.data,
          },
          include: { plan: true, subscription: true },
        });

        // Dispatch Nodemailer confirmation receipt email
        sendPaymentSuccessEmail({
          to: transaction.company.email,
          name: transaction.company.name || transaction.company.companyProfile?.companyName || "Organization Admin",
          planName: plan.name,
          amountInPaise: transaction.amount,
          billingCycle: plan.billingCycle,
          validUntil: currentPeriodEnd,
          transactionId: merchantTransactionId,
        });

        console.log(`✅ [PhonePe Return] Subscription activated and receipt emailed to ${transaction.company.email}`);

        return res.json(updatedTxn);
      } else if (statusCheck.code === "PAYMENT_ERROR" || statusCheck.code === "PAYMENT_DECLINED" || statusCheck.code === "TIMED_OUT") {
        const failedTxn = await prisma.paymentTransaction.update({
          where: { merchantTransactionId },
          data: {
            status: PaymentStatus.FAILED,
            responseCode: statusCheck.code,
            rawCallbackPayload: statusCheck.data,
          },
          include: { plan: true },
        });

        sendPaymentFailedEmail({
          to: transaction.company.email,
          name: transaction.company.name || "Organization Admin",
          planName: transaction.plan.name,
          amountInPaise: transaction.amount,
          transactionId: merchantTransactionId,
          reason: statusCheck.message || "Payment was rejected or cancelled",
        });

        return res.json(failedTxn);
      }
    }

    res.json(transaction);
  } catch (error) {
    console.error("Error verifying transaction status:", error);
    res.status(500).json({ error: "Failed to verify transaction status" });
  }
};

/**
 * Returns current company user's active subscription, validity, quotas & payment history
 */
export const getMySubscription = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Determine target companyId (if manager/client, inspect their parent company)
    const companyId = user.role === Role.COMPANY ? user.id : user.companyId;

    if (!companyId) {
      return res.json({ subscription: null, plan: null, limits: null });
    }

    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        companyId,
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
      },
      include: {
        plan: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const recentTransactions = await prisma.paymentTransaction.findMany({
      where: { companyId },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Calculate remaining days
    let daysRemaining = 0;
    if (activeSubscription) {
      const now = new Date();
      const end = new Date(activeSubscription.currentPeriodEnd);
      daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }

    // Count team members created under this company
    const memberCount = await prisma.user.count({
      where: { companyId },
    });

    res.json({
      subscription: activeSubscription,
      plan: activeSubscription?.plan || null,
      daysRemaining,
      memberCount,
      transactions: recentTransactions,
    });
  } catch (error) {
    console.error("Error fetching company subscription:", error);
    res.status(500).json({ error: "Failed to fetch subscription details" });
  }
};

/**
 * Admin endpoint: List all subscriptions across all companies with pagination & analytics
 */
export const getAllSubscriptions = async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query["page"] as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query["limit"] as string, 10) || 15));
    const status = req.query["status"] as SubscriptionStatus | undefined;
    const planId = req.query["planId"] as string | undefined;

    const where: Prisma.SubscriptionWhereInput = {};
    if (status) where.status = status;
    if (planId) where.planId = planId;

    const [total, subscriptions, activeCount, totalRevenueResult] = await Promise.all([
      prisma.subscription.count({ where }),
      prisma.subscription.findMany({
        where,
        include: {
          plan: true,
          company: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              companyProfile: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.subscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
      prisma.paymentTransaction.aggregate({
        where: { status: PaymentStatus.SUCCESS },
        _sum: { amount: true },
      }),
    ]);

    res.json({
      data: subscriptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        activeSubscribers: activeCount,
        totalRevenueInPaise: totalRevenueResult._sum.amount || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    res.status(500).json({ error: "Failed to fetch subscriptions" });
  }
};
