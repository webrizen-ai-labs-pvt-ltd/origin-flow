import { useState, useEffect } from "react";
import {
  Sparkles,
  CreditCard,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  Users,
  HardDrive,
  TrendingUp,
  Building2,
  Zap,
} from "lucide-react";
import { Button, Card, LoadingIndicator, Pagination } from "@origin-flow/ui";
import {
  PlanService,
  type Plan,
  type SubscriptionsResponse,
} from "../services/plan-service";
import { CreatePlanModal } from "../components/plans/create-plan-modal";
import { EditPlanModal } from "../components/plans/edit-plan-modal";
import { AssignPlanModal } from "../components/plans/assign-plan-modal";

export function PlansPage() {
  const [activeTab, setActiveTab] = useState<"plans" | "subscribers">("plans");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscribersData, setSubscribersData] = useState<SubscriptionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [assigningPlanId, setAssigningPlanId] = useState<string | undefined>(undefined);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [page]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [plansRes, subsRes] = await Promise.all([
        PlanService.getPlans(),
        PlanService.getSubscriptions({ page, limit: 10 }),
      ]);
      setPlans(plansRes);
      setSubscribersData(subsRes);
    } catch (err) {
      console.error("Error loading plans data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePlan = async (plan: Plan) => {
    if (confirm(`Are you sure you want to delete/deactivate "${plan.name}"?`)) {
      try {
        await PlanService.deletePlan(plan.id);
        loadData();
      } catch (err: any) {
        alert(err.response?.data?.error || "Failed to delete plan");
      }
    }
  };

  const handleOpenAssign = (planId?: string) => {
    setAssigningPlanId(planId);
    setIsAssignModalOpen(true);
  };

  // Format currency helpers
  const formatCurrency = (paise: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(paise / 100);
  };

  const totalRevenue = subscribersData?.stats?.totalRevenueInPaise || 0;
  const activeSubsCount = subscribersData?.stats?.activeSubscribers || 0;

  return (
    <div className="space-y-6 p-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Subscription & Plan Management</h1>
          <p className="text-sm text-tertiary">
            Create pricing tiers, manage quotas, track subscribers, and process PhonePe payments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            color="secondary"
            onPress={() => handleOpenAssign()}
            iconLeading={<Users data-icon />}
          >
            Assign to Company
          </Button>
          <Button
            size="sm"
            color="primary"
            onPress={() => setIsCreateModalOpen(true)}
            iconLeading={<Plus data-icon />}
          >
            Create New Plan
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-tertiary uppercase tracking-wider">Total Revenue</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-bold text-primary">{formatCurrency(totalRevenue)}</h2>
            <p className="mt-0.5 text-xs text-tertiary">Processed through PhonePe PG</p>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-tertiary uppercase tracking-wider">Active Subscribers</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
              <Building2 className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-bold text-primary">{activeSubsCount}</h2>
            <p className="mt-0.5 text-xs text-tertiary">Organizations with active plans</p>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-tertiary uppercase tracking-wider">Configured Plans</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <CreditCard className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-bold text-primary">{plans.length}</h2>
            <p className="mt-0.5 text-xs text-tertiary">
              {plans.filter((p) => p.isActive).length} currently active & public
            </p>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-tertiary uppercase tracking-wider">Payment Gateway</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
              <Zap className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-base font-bold text-primary">PhonePe PG Live</h2>
            </div>
            <p className="mt-1 text-xs text-tertiary">UPI, Cards, NetBanking (UAT/Prod)</p>
          </div>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-secondary">
        <button
          onClick={() => setActiveTab("plans")}
          className={`px-5 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            activeTab === "plans"
              ? "border-brand-primary text-brand-primary"
              : "border-transparent text-tertiary hover:text-primary"
          }`}
        >
          Pricing Plans ({plans.length})
        </button>
        <button
          onClick={() => setActiveTab("subscribers")}
          className={`px-5 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            activeTab === "subscribers"
              ? "border-brand-primary text-brand-primary"
              : "border-transparent text-tertiary hover:text-primary"
          }`}
        >
          Subscribers & History ({subscribersData?.pagination?.total || 0})
        </button>
      </div>

      {/* Tab 1: Pricing Plans Grid */}
      {activeTab === "plans" && (
        <>
          {isLoading ? (
            <div className="py-20 text-center">
              <LoadingIndicator type="line-spinner" size="md" label="Loading subscription plans..." />
            </div>
          ) : plans.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-12 text-center">
              <CreditCard className="size-12 text-tertiary/40 mb-3" />
              <h3 className="text-base font-semibold text-primary">No Subscription Plans Configured</h3>
              <p className="text-xs text-tertiary max-w-sm mt-1">
                Get started by creating your first subscription tier with custom pricing, quotas, and compliance features.
              </p>
              <Button
                size="sm"
                color="primary"
                className="mt-4"
                onPress={() => setIsCreateModalOpen(true)}
                iconLeading={<Plus data-icon />}
              >
                Create First Plan
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col justify-between p-6 transition-all hover:shadow-lg ${
                    plan.isPopular ? "border-brand-primary/60 ring-1 ring-brand-primary/40 bg-brand-primary/[0.02]" : ""
                  }`}
                >
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-md px-2.5 py-0.5 text-[11px] font-semibold border ${
                          plan.isActive
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : "bg-secondary/40 text-tertiary border-secondary"
                        }`}
                      >
                        {plan.isActive ? "Active" : "Inactive"}
                      </span>
                      {plan.isPopular && (
                        <span className="flex items-center gap-1 rounded-md bg-brand-primary/10 px-2 py-0.5 text-[11px] font-semibold text-brand-primary border border-brand-primary/20">
                          <Sparkles className="size-3" /> Most Popular
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingPlan(plan)}
                        className="rounded-lg p-1.5 text-tertiary hover:bg-secondary/40 hover:text-primary transition-colors"
                        title="Edit Plan"
                      >
                        <Edit3 className="size-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan)}
                        className="rounded-lg p-1.5 text-tertiary hover:bg-error-primary/10 hover:text-error-primary transition-colors"
                        title="Delete Plan"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Pricing */}
                  <div>
                    <h3 className="text-lg font-bold text-primary">{plan.name}</h3>
                    <p className="text-xs text-tertiary mt-1 min-h-[32px] line-clamp-2">
                      {plan.description || "Comprehensive business compliance & user management tier."}
                    </p>

                    <div className="my-5 flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-primary">{formatCurrency(plan.price)}</span>
                      <span className="text-xs font-medium text-tertiary">/ {plan.billingCycle.toLowerCase()}</span>
                    </div>

                    {/* Quota Limits Bar */}
                    <div className="rounded-xl border border-secondary bg-secondary/10 p-3.5 space-y-2 mb-5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-tertiary flex items-center gap-1.5">
                          <Users className="size-3.5" /> Staff Managers
                        </span>
                        <span className="font-semibold text-primary">Up to {plan.limits?.maxManagers ?? 5}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-tertiary flex items-center gap-1.5">
                          <Users className="size-3.5" /> Client Accounts
                        </span>
                        <span className="font-semibold text-primary">Up to {plan.limits?.maxClients ?? 50}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-tertiary flex items-center gap-1.5">
                          <HardDrive className="size-3.5" /> Storage Cap
                        </span>
                        <span className="font-semibold text-primary">{plan.limits?.storageGb ?? 10} GB</span>
                      </div>
                    </div>

                    {/* Features Checklist */}
                    <div className="space-y-2.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-tertiary">Included Features:</p>
                      {plan.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-secondary">
                          <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Action */}
                  <div className="pt-6 mt-6 border-t border-secondary">
                    <Button
                      size="sm"
                      color="secondary"
                      className="w-full"
                      onPress={() => handleOpenAssign(plan.id)}
                    >
                      Assign to Company
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab 2: Subscribers Directory */}
      {activeTab === "subscribers" && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-secondary bg-secondary/30 text-[11px] font-semibold uppercase tracking-wider text-tertiary">
                <tr>
                  <th className="px-6 py-3.5">Organization</th>
                  <th className="px-6 py-3.5">Assigned Plan</th>
                  <th className="px-6 py-3.5">Billing Cycle</th>
                  <th className="px-6 py-3.5">Validity Period</th>
                  <th className="px-6 py-3.5">Type</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <LoadingIndicator type="line-spinner" size="md" label="Loading subscriber records..." />
                    </td>
                  </tr>
                ) : !subscribersData || subscribersData.data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-tertiary">
                      No subscriber records found.
                    </td>
                  </tr>
                ) : (
                  subscribersData.data.map((sub) => (
                    <tr key={sub.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
                            <Building2 className="size-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-primary text-xs">
                              {sub.company?.companyProfile?.companyName || sub.company?.name || "Company Account"}
                            </p>
                            <p className="text-[11px] text-tertiary">{sub.company?.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-semibold text-xs text-primary">{sub.plan?.name}</span>
                        <p className="text-[11px] text-tertiary">{formatCurrency(sub.plan?.price)}</p>
                      </td>

                      <td className="px-6 py-4 text-xs text-secondary font-medium capitalize">
                        {sub.plan?.billingCycle.toLowerCase()}
                      </td>

                      <td className="px-6 py-4 text-xs text-secondary">
                        <div>
                          <span>
                            {new Date(sub.currentPeriodStart).toLocaleDateString("en-IN")} &rarr;{" "}
                            {new Date(sub.currentPeriodEnd).toLocaleDateString("en-IN")}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {sub.assignedByAdmin ? (
                          <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-500 border border-purple-500/20">
                            Admin Assigned
                          </span>
                        ) : (
                          <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-500 border border-blue-500/20">
                            PhonePe PG
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-md px-2.5 py-0.5 text-[10px] font-semibold border ${
                            sub.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : sub.status === "TRIALING"
                              ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                              : "bg-error-primary/10 text-error-primary border-error-primary/20"
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {subscribersData && subscribersData.pagination.totalPages > 1 && (
            <div className="border-t border-secondary p-4">
              <Pagination
                currentPage={page}
                totalPages={subscribersData.pagination.totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </Card>
      )}

      {/* Modals */}
      <CreatePlanModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={loadData}
      />

      <EditPlanModal
        isOpen={!!editingPlan}
        plan={editingPlan}
        onClose={() => setEditingPlan(null)}
        onUpdated={loadData}
      />

      <AssignPlanModal
        isOpen={isAssignModalOpen}
        preselectedPlanId={assigningPlanId}
        onClose={() => setIsAssignModalOpen(false)}
        onAssigned={loadData}
      />
    </div>
  );
}
