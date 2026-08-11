import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CompanyProfile {
  id?: string;
  companyName: string;
  pan?: string | null;
  gstin?: string | null;
  address?: string | null;
  udin?: string | null;
  frn?: string | null;
  auditCaps?: string | null;
  din?: string | null;
  tan?: string | null;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "COMPANY" | "MANAGER" | "CLIENT";
  avatarUrl?: string | null;
  phone?: string | null;
  companyId?: string | null;
  isVerified?: boolean;
  createdAt?: Date | string;
  companyProfile?: CompanyProfile | null;
  activeSubscription?: {
    id: string;
    status: string;
    currentPeriodEnd: string;
    plan?: {
      id: string;
      name: string;
      slug: string;
      price: number;
      billingCycle: string;
    };
  } | null;
  passkeys?: any[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: "management-auth-storage",
    }
  )
);
