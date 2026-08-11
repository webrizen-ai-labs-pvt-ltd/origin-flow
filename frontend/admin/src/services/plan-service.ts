import axios from "axios";
import { useAuthStore } from "../store/auth.store";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type BillingCycle = "MONTHLY" | "QUARTERLY" | "YEARLY" | "LIFETIME";
export type SubscriptionStatus = "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED" | "EXPIRED" | "PENDING";
export type PaymentStatus = "INITIATED" | "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";

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
  billingCycle: BillingCycle;
  features: string[];
  limits?: PlanLimits | null;
  isActive: boolean;
  isPopular: boolean;
  trialDays: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    subscriptions: number;
  };
}

export interface Subscription {
  id: string;
  companyId: string;
  company?: {
    id: string;
    name: string;
    email: string;
    role: string;
    companyProfile?: {
      companyName: string;
    } | null;
  };
  planId: string;
  plan: Plan;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  assignedByAdmin: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTransaction {
  id: string;
  merchantTransactionId: string;
  phonePeTransactionId?: string | null;
  companyId: string;
  planId: string;
  plan?: Plan;
  subscriptionId?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMode?: string | null;
  responseCode?: string | null;
  createdAt: string;
}

export interface CreatePlanInput {
  name: string;
  slug: string;
  description?: string;
  price: number; // in Paise
  currency?: string;
  billingCycle: BillingCycle;
  features: string[];
  limits?: PlanLimits;
  isActive?: boolean;
  isPopular?: boolean;
  trialDays?: number;
}

export interface UpdatePlanInput extends Partial<CreatePlanInput> {}

export interface AssignPlanInput {
  companyId: string;
  planId: string;
  durationDays?: number;
  notes?: string;
}

export interface SubscriptionsResponse {
  data: Subscription[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    activeSubscribers: number;
    totalRevenueInPaise: number;
  };
}

export const PlanService = {
  // Public & Admin Plan Queries
  async getPlans(): Promise<Plan[]> {
    const response = await api.get<Plan[]>("/plans");
    return response.data;
  },

  async getPlanById(id: string): Promise<Plan> {
    const response = await api.get<Plan>(`/plans/${id}`);
    return response.data;
  },

  async createPlan(input: CreatePlanInput): Promise<Plan> {
    const response = await api.post<Plan>("/plans", input);
    return response.data;
  },

  async updatePlan(id: string, input: UpdatePlanInput): Promise<Plan> {
    const response = await api.put<Plan>(`/plans/${id}`, input);
    return response.data;
  },

  async deletePlan(id: string): Promise<{ message: string; plan?: Plan }> {
    const response = await api.delete(`/plans/${id}`);
    return response.data;
  },

  async assignPlan(input: AssignPlanInput): Promise<Subscription> {
    const response = await api.post<Subscription>("/plans/assign", input);
    return response.data;
  },

  // Subscription Management
  async getSubscriptions(params?: {
    page?: number;
    limit?: number;
    status?: SubscriptionStatus;
    planId?: string;
  }): Promise<SubscriptionsResponse> {
    const response = await api.get<SubscriptionsResponse>("/subscriptions", { params });
    return response.data;
  },

  async getMySubscription(): Promise<{
    subscription: Subscription | null;
    plan: Plan | null;
    daysRemaining: number;
    memberCount: number;
    transactions: PaymentTransaction[];
  }> {
    const response = await api.get("/subscriptions/my-subscription");
    return response.data;
  },

  async initiateCheckout(planId: string, redirectUrl?: string): Promise<{
    success: boolean;
    merchantTransactionId: string;
    redirectUrl: string;
  }> {
    const response = await api.post("/subscriptions/checkout", { planId, redirectUrl });
    return response.data;
  },

  async verifyPayment(merchantTransactionId: string): Promise<PaymentTransaction> {
    const response = await api.get(`/subscriptions/verify/${merchantTransactionId}`);
    return response.data;
  },
};
