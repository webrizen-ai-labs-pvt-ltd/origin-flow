import axios from "axios";
import { useAuthStore } from "../store/auth.store";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
    subscriptions?: Array<{
      status: string;
      plan?: {
        name: string;
      };
    }>;
  } | null;
  subordinates?: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    isVerified: boolean;
    avatarUrl?: string | null;
  }>;
  passkeys?: Array<{
    id: string;
    credentialID?: string;
    counter?: number;
    credentialDeviceType?: string;
    credentialBackedUp?: boolean;
    transports?: string | null;
    createdAt: string;
  }>;
}

export interface SessionItem {
  id: string;
  userId: string;
  device?: string | null;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface UsersResponse {
  data: UserSummary[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface FetchUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isVerified?: boolean | string;
  companyId?: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  role: "ADMIN" | "COMPANY" | "MANAGER" | "CLIENT";
  companyId?: string | null;
  companyProfile?: {
    companyName: string;
    pan?: string | null;
    gstin?: string | null;
    address?: string | null;
    udin?: string | null;
    frn?: string | null;
    auditCaps?: string | null;
    din?: string | null;
    tan?: string | null;
  };
}

export interface UpdateUserPayload {
  name?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  companyProfile?: Partial<CompanyProfile>;
}

export const UserService = {
  async getUsers(params: FetchUsersParams = {}): Promise<UsersResponse> {
    const res = await api.get<UsersResponse>("/users", { params });
    return res.data;
  },

  async getUserById(id: string): Promise<UserSummary> {
    const res = await api.get<UserSummary>(`/users/${id}`);
    return res.data;
  },

  async getMe(): Promise<UserSummary> {
    const res = await api.get<UserSummary>("/users/me");
    return res.data;
  },

  async createUser(payload: CreateUserPayload): Promise<UserSummary> {
    const res = await api.post<UserSummary>("/users", payload);
    return res.data;
  },

  async updateUser(id: string, payload: UpdateUserPayload): Promise<UserSummary> {
    const res = await api.put<UserSummary>(`/users/${id}`, payload);
    return res.data;
  },

  async approveUser(id: string): Promise<UserSummary> {
    const res = await api.patch<UserSummary>(`/users/${id}/approve`);
    return res.data;
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  async getSessions(userId: string): Promise<SessionItem[]> {
    const res = await api.get<SessionItem[]>(`/users/${userId}/sessions`);
    return res.data;
  },

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    await api.delete(`/users/${userId}/sessions/${sessionId}`);
  },

  async getCompanies(): Promise<UserSummary[]> {
    const res = await api.get<UsersResponse>("/users", {
      params: { role: "COMPANY", limit: 100 },
    });
    return res.data.data;
  },
};
