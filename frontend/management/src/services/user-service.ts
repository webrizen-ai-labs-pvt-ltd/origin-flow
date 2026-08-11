import { api } from "./api";

export interface CompanyProfile {
  id?: string;
  userId?: string;
  companyName: string;
  pan?: string | null;
  gstin?: string | null;
  address?: string | null;
  udin?: string | null;
  frn?: string | null;
  auditCaps?: string | null;
  din?: string | null;
  tan?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "COMPANY" | "MANAGER" | "CLIENT";
  avatarUrl?: string | null;
  phone?: string | null;
  isVerified: boolean;
  companyId?: string | null;
  createdAt: string;
  updatedAt?: string;
  companyProfile?: CompanyProfile | null;
  activeSubscription?: {
    id: string;
    status: string;
    plan?: {
      id: string;
      name: string;
      slug: string;
      price: number;
      billingCycle: string;
    };
  } | null;
  company?: {
    id: string;
    name: string;
    email: string;
    role?: string;
  } | null;
  subordinates?: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    isVerified: boolean;
    avatarUrl?: string | null;
  }>;
}

export interface FetchUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: "COMPANY" | "MANAGER" | "CLIENT";
  isVerified?: boolean;
}

export interface UsersResponse {
  data: UserSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const UserService = {
  getMe: async (): Promise<UserSummary> => {
    const res = await api.get("/users/me");
    return res.data;
  },

  getUsers: async (params?: FetchUsersParams): Promise<UsersResponse> => {
    const res = await api.get("/users", { params });
    return res.data;
  },

  getUserById: async (id: string): Promise<UserSummary> => {
    const res = await api.get(`/users/${id}`);
    return res.data;
  },

  createUser: async (payload: {
    email: string;
    name: string;
    role: "MANAGER" | "CLIENT";
    companyId?: string;
  }): Promise<UserSummary> => {
    const res = await api.post("/users", payload);
    return res.data;
  },

  updateUser: async (
    id: string,
    payload: {
      name?: string;
      phone?: string;
      avatarUrl?: string;
      companyProfile?: CompanyProfile;
    }
  ): Promise<UserSummary> => {
    const res = await api.patch(`/users/${id}`, payload);
    return res.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  approveUser: async (id: string): Promise<UserSummary> => {
    const res = await api.patch(`/users/${id}/approve`);
    return res.data;
  },
};
