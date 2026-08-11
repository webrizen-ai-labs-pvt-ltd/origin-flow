import { api } from "./api";

export interface PlanLimits {
  maxManagers?: number;
  maxClients?: number;
  storageGb?: number;
  canUseAuditCompliance?: boolean;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number; // in Paise
  currency: string;
  billingCycle: "MONTHLY" | "QUARTERLY" | "YEARLY" | "LIFETIME";
  features: string[];
  limits?: PlanLimits | null;
  isActive: boolean;
  isPopular: boolean;
  trialDays: number;
}

export interface Subscription {
  id: string;
  companyId: string;
  planId: string;
  status: "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED" | "EXPIRED" | "PENDING";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  assignedByAdmin: boolean;
  notes?: string | null;
  plan: Plan;
}

export interface PaymentTransaction {
  id: string;
  merchantTransactionId: string;
  phonePeTransactionId?: string | null;
  amount: number;
  currency: string;
  status: "INITIATED" | "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
  paymentMode?: string | null;
  createdAt: string;
  plan?: Plan;
}

export interface MySubscriptionResponse {
  subscription: Subscription | null;
  plan: Plan | null;
  daysRemaining: number;
  memberCount: number;
  transactions: PaymentTransaction[];
}

export const SubscriptionService = {
  getMySubscription: async (): Promise<MySubscriptionResponse> => {
    const res = await api.get("/subscriptions/me");
    return res.data;
  },

  getAvailablePlans: async (): Promise<Plan[]> => {
    const res = await api.get("/plans");
    return res.data;
  },

  initiateCheckout: async (payload: {
    planId: string;
    redirectUrl?: string;
  }): Promise<{ success: boolean; merchantTransactionId: string; redirectUrl: string }> => {
    const res = await api.post("/subscriptions/checkout", payload);
    return res.data;
  },

  verifyStatus: async (merchantTransactionId: string): Promise<PaymentTransaction> => {
    const res = await api.get(`/subscriptions/verify/${merchantTransactionId}`);
    return res.data;
  },
};
