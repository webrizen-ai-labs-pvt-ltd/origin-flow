import { useState, useEffect } from "react";
import { X, Plus, Trash2, CheckCircle2, Edit3, Shield, Users, HardDrive } from "lucide-react";
import { Button } from "@origin-flow/ui";
import { PlanService, type Plan, type BillingCycle, type UpdatePlanInput } from "../../services/plan-service";

interface EditPlanModalProps {
  isOpen: boolean;
  plan: Plan | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditPlanModal({ isOpen, plan, onClose, onUpdated }: EditPlanModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    priceInRupees: 0,
    billingCycle: "MONTHLY" as BillingCycle,
    isActive: true,
    isPopular: false,
    trialDays: 0,
    maxManagers: 5,
    maxClients: 50,
    storageGb: 10,
    canUseAuditCompliance: true,
  });

  const [features, setFeatures] = useState<string[]>([]);
  const [newFeatureText, setNewFeatureText] = useState("");

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        slug: plan.slug,
        description: plan.description || "",
        priceInRupees: Math.round(plan.price / 100),
        billingCycle: plan.billingCycle,
        isActive: plan.isActive,
        isPopular: plan.isPopular,
        trialDays: plan.trialDays || 0,
        maxManagers: plan.limits?.maxManagers ?? 5,
        maxClients: plan.limits?.maxClients ?? 50,
        storageGb: plan.limits?.storageGb ?? 10,
        canUseAuditCompliance: plan.limits?.canUseAuditCompliance ?? true,
      });
      setFeatures(plan.features || []);
    }
  }, [plan]);

  if (!isOpen || !plan) return null;

  const handleAddFeature = () => {
    if (newFeatureText.trim()) {
      setFeatures((prev) => [...prev, newFeatureText.trim()]);
      setNewFeatureText("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const payload: UpdatePlanInput = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || undefined,
        price: Math.round(Number(formData.priceInRupees) * 100),
        billingCycle: formData.billingCycle,
        isActive: formData.isActive,
        isPopular: formData.isPopular,
        trialDays: Number(formData.trialDays) || 0,
        features,
        limits: {
          maxManagers: Number(formData.maxManagers) || 0,
          maxClients: Number(formData.maxClients) || 0,
          storageGb: Number(formData.storageGb) || 0,
          canUseAuditCompliance: formData.canUseAuditCompliance,
        },
      };

      await PlanService.updatePlan(plan.id, payload);
      onUpdated();
      onClose();
    } catch (err: any) {
      console.error("Failed to update plan:", err);
      setErrorMsg(err.response?.data?.error || "Failed to update subscription plan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-secondary bg-primary shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-secondary px-6 py-4 bg-secondary/20">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
              <Edit3 className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-primary">Edit Plan: {plan.name}</h2>
              <p className="text-xs text-tertiary">Update pricing, active availability, quotas and features</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-tertiary hover:bg-secondary/40 hover:text-primary transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="rounded-xl border border-error_subtle bg-error-primary/10 p-3 text-xs text-error-primary">
              {errorMsg}
            </div>
          )}

          {/* Basic Details */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-primary">Plan Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-secondary bg-primary px-3.5 py-2.5 text-sm text-primary placeholder:text-tertiary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-primary">Slug *</label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                className="w-full rounded-xl border border-secondary bg-primary px-3.5 py-2.5 text-sm font-mono text-primary placeholder:text-tertiary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-primary">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-xl border border-secondary bg-primary px-3.5 py-2.5 text-sm text-primary placeholder:text-tertiary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          {/* Pricing & Cycle */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-primary">Price (₹ INR) *</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-tertiary">₹</span>
                <input
                  type="number"
                  required
                  min={0}
                  step="1"
                  value={formData.priceInRupees}
                  onChange={(e) => setFormData({ ...formData, priceInRupees: Number(e.target.value) })}
                  className="w-full rounded-xl border border-secondary bg-primary pl-8 pr-3.5 py-2.5 text-sm font-semibold text-primary placeholder:text-tertiary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-primary">Billing Cycle *</label>
              <select
                value={formData.billingCycle}
                onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value as BillingCycle })}
                className="w-full rounded-xl border border-secondary bg-primary px-3.5 py-2.5 text-sm text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="YEARLY">Yearly (Annual)</option>
                <option value="LIFETIME">Lifetime Access</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-primary">Free Trial Days</label>
              <input
                type="number"
                min={0}
                value={formData.trialDays}
                onChange={(e) => setFormData({ ...formData, trialDays: Number(e.target.value) })}
                className="w-full rounded-xl border border-secondary bg-primary px-3.5 py-2.5 text-sm text-primary placeholder:text-tertiary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
            </div>
          </div>

          {/* Visibility & Popular Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-secondary bg-secondary/10 p-3.5">
              <input
                type="checkbox"
                id="editIsActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="size-4 rounded text-brand-primary focus:ring-brand-primary"
              />
              <label htmlFor="editIsActive" className="text-xs font-medium text-primary cursor-pointer select-none">
                Plan is <strong>Active & Public</strong> for subscriptions
              </label>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-secondary bg-secondary/10 p-3.5">
              <input
                type="checkbox"
                id="editIsPopular"
                checked={formData.isPopular}
                onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                className="size-4 rounded text-brand-primary focus:ring-brand-primary"
              />
              <label htmlFor="editIsPopular" className="text-xs font-medium text-primary cursor-pointer select-none">
                Highlight as <strong>"Most Popular"</strong>
              </label>
            </div>
          </div>

          {/* Quota & Limits Section */}
          <div className="rounded-xl border border-secondary bg-secondary/10 p-4 space-y-3.5">
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-brand-secondary" />
              <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">Plan Quota Limits</h3>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-tertiary">Max Managers</label>
                <div className="flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-2.5 py-1.5">
                  <Users className="size-3.5 text-tertiary" />
                  <input
                    type="number"
                    min={0}
                    value={formData.maxManagers}
                    onChange={(e) => setFormData({ ...formData, maxManagers: Number(e.target.value) })}
                    className="w-full bg-transparent text-xs text-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-tertiary">Max Clients</label>
                <div className="flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-2.5 py-1.5">
                  <Users className="size-3.5 text-tertiary" />
                  <input
                    type="number"
                    min={0}
                    value={formData.maxClients}
                    onChange={(e) => setFormData({ ...formData, maxClients: Number(e.target.value) })}
                    className="w-full bg-transparent text-xs text-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-tertiary">Storage (GB)</label>
                <div className="flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-2.5 py-1.5">
                  <HardDrive className="size-3.5 text-tertiary" />
                  <input
                    type="number"
                    min={0}
                    value={formData.storageGb}
                    onChange={(e) => setFormData({ ...formData, storageGb: Number(e.target.value) })}
                    className="w-full bg-transparent text-xs text-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Features Checklist */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-primary">Features Checklist</label>
            
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a new feature..."
                value={newFeatureText}
                onChange={(e) => setNewFeatureText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
                className="flex-1 rounded-xl border border-secondary bg-primary px-3.5 py-2 text-xs text-primary placeholder:text-tertiary focus:border-brand-primary focus:outline-none"
              />
              <Button size="sm" color="secondary" onPress={handleAddFeature} iconLeading={<Plus data-icon />}>
                Add
              </Button>
            </div>

            <div className="space-y-2 max-h-44 overflow-y-auto rounded-xl border border-secondary bg-secondary/10 p-3">
              {features.map((feat, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 rounded-lg bg-primary border border-secondary px-3 py-1.5 text-xs text-primary">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                    <span>{feat}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(idx)}
                    className="text-tertiary hover:text-error-primary p-0.5 rounded transition-colors"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-secondary px-6 py-4 bg-secondary/10">
          <Button color="tertiary" onPress={onClose} isDisabled={isSubmitting}>
            Cancel
          </Button>
          <Button color="primary" onPress={() => handleSubmit()} isDisabled={isSubmitting || !formData.name}>
            {isSubmitting ? "Saving Changes..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
