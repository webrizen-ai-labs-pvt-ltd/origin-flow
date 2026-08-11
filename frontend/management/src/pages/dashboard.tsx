import { useState, useEffect } from "react";
import { useAuthStore } from "../store/auth.store";
import {
  Users,
  Briefcase,
  ShieldCheck,
  Sparkles,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { Button, Card, LoadingIndicator } from "@origin-flow/ui";
import { Link } from "react-router-dom";
import { UserService, type UserSummary } from "../services/user-service";
import { SubscriptionService, type MySubscriptionResponse, type Plan } from "../services/subscription-service";

export function DashboardPage() {
  const { user } = useAuthStore();
  const [subData, setSubData] = useState<MySubscriptionResponse | null>(null);
  const [teamMembers, setTeamMembers] = useState<UserSummary[]>([]);
  const [clients, setClients] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isCompany = user?.role === "COMPANY";

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [subRes, teamRes, clientsRes] = await Promise.all([
        SubscriptionService.getMySubscription().catch(() => null),
        UserService.getUsers({ role: "MANAGER", limit: 5 }).catch(() => ({ data: [] })),
        UserService.getUsers({ role: "CLIENT", limit: 5 }).catch(() => ({ data: [] })),
      ]);

      if (subRes) setSubData(subRes);
      setTeamMembers(teamRes.data || []);
      setClients(clientsRes.data || []);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const activePlan = (subData?.plan || user?.activeSubscription?.plan) as Plan | undefined;
  const daysRemaining = subData?.daysRemaining ?? 30;

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            Welcome back, {user?.name || "Team"}
          </h1>
          <p className="text-sm text-tertiary">
            {isCompany
              ? "Manage your firm's compliance operations, staff hierarchy, and subscription quotas."
              : "Access assigned clients, audit documents, and compliance workflows."}
          </p>
        </div>

        {isCompany && (
          <Link to="/dashboard/billing">
            <Button size="sm" color="primary" iconLeading={<Sparkles data-icon />}>
              Manage Plan & Billing
            </Button>
          </Link>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Plan Tier Card */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-tertiary uppercase tracking-wider">
              Subscription Tier
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
              <Sparkles className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-xl font-bold text-primary">
              {activePlan?.name || "Starter Tier"}
            </h2>
            <p className="mt-0.5 text-xs text-tertiary flex items-center gap-1">
              <Clock className="size-3 text-emerald-500" />
              {daysRemaining > 0 ? `${daysRemaining} days remaining` : "Renewal due"}
            </p>
          </div>
        </Card>

        {/* Staff Managers Card */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-tertiary uppercase tracking-wider">
              Staff Managers
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <Users className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-bold text-primary">{teamMembers.length}</h2>
            <p className="mt-0.5 text-xs text-tertiary">
              Quota: {activePlan?.limits?.maxManagers ?? 5} max managers
            </p>
          </div>
        </Card>

        {/* Clients Card */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-tertiary uppercase tracking-wider">
              Active Clients
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
              <Briefcase className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-bold text-primary">{clients.length}</h2>
            <p className="mt-0.5 text-xs text-tertiary">
              Quota: {activePlan?.limits?.maxClients ?? 50} max clients
            </p>
          </div>
        </Card>

        {/* Compliance Status */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-tertiary uppercase tracking-wider">
              Compliance Status
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <ShieldCheck className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              <h2 className="text-base font-bold text-primary">Verified Firm</h2>
            </div>
            <p className="mt-1 text-xs text-tertiary">GSTIN & PAN records active</p>
          </div>
        </Card>
      </div>

      {/* Grid: Recent Team & Clients */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Staff Managers */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-primary">Staff Managers</h2>
              <p className="text-xs text-tertiary">Delegated team leads managing client audits</p>
            </div>
            <Link to="/dashboard/team" className="text-xs font-semibold text-brand-primary flex items-center gap-1 hover:underline">
              View all <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="py-8 text-center">
              <LoadingIndicator type="line-spinner" size="sm" label="Loading team..." />
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="py-8 text-center text-xs text-tertiary">
              No staff managers added yet. Invite your first manager in the Team tab.
            </div>
          ) : (
            <div className="divide-y divide-secondary">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 font-bold text-xs">
                      {member.name ? member.name[0].toUpperCase() : "M"}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-primary">{member.name}</p>
                      <p className="text-[11px] text-tertiary">{member.email}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                    Active
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Clients */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-primary">Client Accounts</h2>
              <p className="text-xs text-tertiary">Organizations with active compliance filings</p>
            </div>
            <Link to="/dashboard/clients" className="text-xs font-semibold text-brand-primary flex items-center gap-1 hover:underline">
              View all <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="py-8 text-center">
              <LoadingIndicator type="line-spinner" size="sm" label="Loading clients..." />
            </div>
          ) : clients.length === 0 ? (
            <div className="py-8 text-center text-xs text-tertiary">
              No clients enrolled yet. Add your first client in the Clients tab.
            </div>
          ) : (
            <div className="divide-y divide-secondary">
              {clients.map((client) => (
                <div key={client.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-purple-500/10 text-purple-600 font-bold text-xs">
                      {client.name ? client.name[0].toUpperCase() : "C"}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-primary">{client.name}</p>
                      <p className="text-[11px] text-tertiary">{client.email}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                    Client Portal
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
