import { useState, useEffect } from "react";
import { X, CreditCard, CheckCircle2 } from "lucide-react";
import { Button } from "@origin-flow/ui";
import { PlanService, type Plan } from "../../services/plan-service";
import { UserService, type UserSummary } from "../../services/user-service";

interface AssignPlanModalProps {
  isOpen: boolean;
  preselectedPlanId?: string;
  onClose: () => void;
  onAssigned: () => void;
}

export function AssignPlanModal({ isOpen, preselectedPlanId, onClose, onAssigned }: AssignPlanModalProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [companies, setCompanies] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState(preselectedPlanId || "");
  const [durationDays, setDurationDays] = useState(30);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (preselectedPlanId) {
      setSelectedPlanId(preselectedPlanId);
      const plan = plans.find((p) => p.id === preselectedPlanId);
      if (plan) {
        setDurationDays(plan.billingCycle === "YEARLY" ? 365 : plan.billingCycle === "QUARTERLY" ? 90 : 30);
      }
    }
  }, [preselectedPlanId, plans]);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const [plansData, usersData] = await Promise.all([
        PlanService.getPlans(),
        UserService.getUsers({ role: "COMPANY", limit: 100 }),
      ]);
      setPlans(plansData);
      setCompanies(usersData.data);
      if (usersData.data.length > 0 && !selectedCompanyId) {
        setSelectedCompanyId(usersData.data[0].id);
      }
      if (plansData.length > 0 && !selectedPlanId) {
        const initialPlanId = preselectedPlanId || plansData[0].id;
        setSelectedPlanId(initialPlanId);
        const p = plansData.find((pl) => pl.id === initialPlanId);
        if (p) {
          setDurationDays(p.billingCycle === "YEARLY" ? 365 : p.billingCycle === "QUARTERLY" ? 90 : 30);
        }
      }
    } catch (err) {
      console.error("Error loading assignment data:", err);
      setErrorMsg("Failed to load companies or plans list");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    const p = plans.find((pl) => pl.id === planId);
    if (p) {
      setDurationDays(p.billingCycle === "YEARLY" ? 365 : p.billingCycle === "QUARTERLY" ? 90 : 30);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedCompanyId || !selectedPlanId) {
      setErrorMsg("Please select both a company and a plan");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      await PlanService.assignPlan({
        companyId: selectedCompanyId,
        planId: selectedPlanId,
        durationDays: Number(durationDays),
        notes: notes.trim() || undefined,
      });

      onAssigned();
      onClose();
    } catch (err: any) {
      console.error("Failed to assign plan:", err);
      setErrorMsg(err.response?.data?.error || "Failed to assign plan to company");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-secondary bg-primary shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-secondary px-6 py-4 bg-secondary/20">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
              <CreditCard className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-primary">Assign Plan to Company</h2>
              <p className="text-xs text-tertiary">Grant complimentary, trial, or custom enterprise tier access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-tertiary hover:bg-secondary/40 hover:text-primary transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="rounded-xl border border-error_subtle bg-error-primary/10 p-3 text-xs text-error-primary">
              {errorMsg}
            </div>
          )}

          {isLoading ? (
            <div className="py-8 text-center text-xs text-tertiary">Loading companies and plans...</div>
          ) : (
            <>
              {/* Select Company */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary">Target Organization (Company User) *</label>
                <div className="relative">
                  <select
                    required
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    className="w-full rounded-xl border border-secondary bg-primary px-3.5 py-2.5 text-sm text-primary focus:border-brand-primary focus:outline-none"
                  >
                    {companies.length === 0 ? (
                      <option value="">No Company accounts found</option>
                    ) : (
                      companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.companyProfile?.companyName || c.name} ({c.email})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Select Plan */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary">Subscription Plan *</label>
                <select
                  required
                  value={selectedPlanId}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  className="w-full rounded-xl border border-secondary bg-primary px-3.5 py-2.5 text-sm text-primary focus:border-brand-primary focus:outline-none"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₹{(p.price / 100).toLocaleString("en-IN")} / {p.billingCycle.toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration in Days */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary">Access Duration (Days) *</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min={1}
                    max={3650}
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full rounded-xl border border-secondary bg-primary px-3.5 py-2.5 text-sm text-primary placeholder:text-tertiary focus:border-brand-primary focus:outline-none"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-tertiary">
                    {durationDays >= 365
                      ? `(~${(durationDays / 365).toFixed(1)} years)`
                      : `(~${Math.round(durationDays / 30)} months)`}
                  </span>
                </div>
              </div>

              {/* Admin Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary">Admin Notes / Reason</label>
                <textarea
                  rows={2}
                  placeholder="e.g. VIP onboarding trial / Custom enterprise agreement signed"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-secondary bg-primary px-3.5 py-2 text-xs text-primary placeholder:text-tertiary focus:border-brand-primary focus:outline-none"
                />
              </div>

              <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-3 text-xs text-secondary flex items-start gap-2">
                <CheckCircle2 className="size-4 text-brand-primary shrink-0 mt-0.5" />
                <span>
                  Assigning this plan will immediately activate access and notify the company admin via email. Any existing active subscription for this company will be superseded.
                </span>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-secondary">
            <Button color="tertiary" onPress={onClose} isDisabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={() => handleSubmit()}
              isDisabled={isSubmitting || isLoading || !selectedCompanyId || !selectedPlanId}
            >
              {isSubmitting ? "Assigning..." : "Assign Subscription"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
