import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Sparkles,
  CheckCircle2,
  Users,
  HardDrive,
  Clock,
  ArrowRight,
  Zap,
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react";
import { Button, Card, LoadingIndicator } from "@origin-flow/ui";
import {
  SubscriptionService,
  type MySubscriptionResponse,
  type Plan,
  type PaymentTransaction,
} from "../services/subscription-service";

export function BillingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [subData, setSubData] = useState<MySubscriptionResponse | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [checkingOutPlanId, setCheckingOutPlanId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Payment Verification State
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    planName?: string;
    amount?: number;
    txnId?: string;
    message?: string;
  } | null>(null);

  useEffect(() => {
    loadBillingData();
    checkIncomingPaymentReturn();
  }, []);

  const loadBillingData = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const [mySub, availablePlans] = await Promise.all([
        SubscriptionService.getMySubscription(),
        SubscriptionService.getAvailablePlans(),
      ]);
      setSubData(mySub);
      setPlans(availablePlans);
    } catch (err: any) {
      console.error("Error loading billing data:", err);
      setErrorMsg("Failed to load subscription details");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Automatically verifies transaction when redirected back from PhonePe
   */
  const checkIncomingPaymentReturn = async () => {
    const txnId =
      searchParams.get("txn") ||
      searchParams.get("transactionId") ||
      searchParams.get("merchantTransactionId");

    if (!txnId) return;

    try {
      setIsVerifying(true);
      setErrorMsg("");

      const result: PaymentTransaction = await SubscriptionService.verifyStatus(txnId);

      if (result.status === "SUCCESS") {
        setVerificationResult({
          success: true,
          planName: result.plan?.name || "Subscription",
          amount: result.amount,
          txnId: result.merchantTransactionId,
          message: "Your payment was confirmed and your subscription is active. A receipt has been sent to your email.",
        });
      } else if (result.status === "FAILED") {
        setVerificationResult({
          success: false,
          txnId: result.merchantTransactionId,
          message: "The transaction was cancelled or declined. No charges were deducted.",
        });
      } else {
        setVerificationResult({
          success: false,
          txnId: result.merchantTransactionId,
          message: `Transaction is currently ${result.status}. If funds were deducted, your subscription will activate shortly.`,
        });
      }

      // Reload fresh subscription data to immediately update quotas & badges
      await loadBillingData();
    } catch (err: any) {
      console.error("Payment verification error:", err);
      setVerificationResult({
        success: false,
        message: "Failed to verify transaction status with PhonePe. Please check your billing history.",
      });
    } finally {
      setIsVerifying(false);
      // Clean query params from URL
      navigate("/dashboard/billing", { replace: true });
    }
  };

  const activeSub = subData?.subscription;
  const currentPlan = subData?.plan;
  const daysRemaining = subData?.daysRemaining ?? 0;

  const handleCheckout = async (plan: Plan) => {
    if (
      (currentPlan && (currentPlan.id === plan.id || currentPlan.slug === plan.slug)) ||
      (activeSub && activeSub.planId === plan.id)
    ) {
      return; // Prevent checkout for existing active plan
    }

    setCheckingOutPlanId(plan.id);
    setErrorMsg("");

    try {
      const res = await SubscriptionService.initiateCheckout({
        planId: plan.id,
        redirectUrl: `${window.location.origin}/dashboard/billing`,
      });

      if (res.success && res.redirectUrl) {
        // Redirect to PhonePe Standard Checkout
        window.location.href = res.redirectUrl;
      } else {
        setErrorMsg("Failed to initiate PhonePe payment order");
      }
    } catch (err: any) {
      console.error("Checkout initiation error:", err);
      setErrorMsg(err.response?.data?.error || "Failed to connect to PhonePe gateway");
    } finally {
      setCheckingOutPlanId(null);
    }
  };

  const formatCurrency = (paise: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(paise / 100);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Plans & Subscription Billing</h1>
        <p className="text-sm text-tertiary">
          Manage your firm's tier, monitor staff and client quota limits, and upgrade via PhonePe Payment Gateway.
        </p>
      </div>

      {/* Verifying Payment Full Overlay / Banner */}
      {isVerifying && (
        <div className="rounded-2xl border border-brand-primary/40 bg-brand-primary/10 p-6 flex items-center gap-4 animate-pulse">
          <Loader2 className="size-8 text-brand-primary animate-spin shrink-0" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-primary">Verifying payment with PhonePe...</h3>
            <p className="text-xs text-secondary">
              Please wait while we confirm your transaction and activate your subscription tier.
            </p>
          </div>
        </div>
      )}

      {/* Verification Result Banner */}
      {verificationResult && (
        <div
          className={`rounded-2xl border p-5 transition-all flex items-start justify-between gap-4 ${
            verificationResult.success
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
              : "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100"
          }`}
        >
          <div className="flex items-start gap-3.5">
            {verificationResult.success ? (
              <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="size-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <h3 className="text-base font-bold">
                {verificationResult.success ? "Payment Confirmed & Subscription Activated!" : "Payment Notice"}
              </h3>
              <p className="text-xs opacity-90 leading-relaxed">{verificationResult.message}</p>
              {verificationResult.txnId && (
                <p className="text-[11px] opacity-75 font-mono pt-1">
                  Transaction Ref: <strong>{verificationResult.txnId}</strong>
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => setVerificationResult(null)}
            className="rounded-lg p-1.5 opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-error_subtle bg-error-primary/10 p-3.5 text-xs text-error-primary">
          {errorMsg}
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center">
          <LoadingIndicator type="line-spinner" size="md" label="Loading subscription details..." />
        </div>
      ) : (
        <>
          {/* Active Subscription Overview Card */}
          {currentPlan ? (
            <Card className="p-6 border-brand-primary/40 bg-brand-primary/[0.02]">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                {/* Plan Details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 border border-emerald-500/20">
                      {activeSub?.status || "ACTIVE"}
                    </span>
                    <span className="text-xs text-tertiary font-medium">Current Firm Subscription</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-primary flex items-center gap-2">
                    {currentPlan.name}
                    <Sparkles className="size-5 text-brand-primary" />
                  </h2>
                  <p className="text-xs text-secondary max-w-xl">
                    {currentPlan.description || "Comprehensive business compliance & multi-manager management tier."}
                  </p>
                  {activeSub?.currentPeriodEnd && (
                    <p className="text-xs text-tertiary flex items-center gap-1.5 pt-1">
                      <Clock className="size-3.5 text-brand-primary" />
                      Valid until{" "}
                      <strong>
                        {new Date(activeSub.currentPeriodEnd).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </strong>{" "}
                      ({daysRemaining} days remaining)
                    </p>
                  )}
                </div>

                {/* Quota Progress Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-secondary bg-primary p-3.5 space-y-1">
                    <span className="text-[11px] font-medium text-tertiary flex items-center gap-1">
                      <Users className="size-3 text-tertiary" /> Staff Managers
                    </span>
                    <p className="text-base font-bold text-primary">
                      {subData?.memberCount ?? 0} / {currentPlan.limits?.maxManagers ?? 5}
                    </p>
                  </div>

                  <div className="rounded-xl border border-secondary bg-primary p-3.5 space-y-1">
                    <span className="text-[11px] font-medium text-tertiary flex items-center gap-1">
                      <Users className="size-3 text-tertiary" /> Client Limit
                    </span>
                    <p className="text-base font-bold text-primary">
                      Up to {currentPlan.limits?.maxClients ?? 50}
                    </p>
                  </div>

                  <div className="rounded-xl border border-secondary bg-primary p-3.5 space-y-1">
                    <span className="text-[11px] font-medium text-tertiary flex items-center gap-1">
                      <HardDrive className="size-3 text-tertiary" /> Storage Cap
                    </span>
                    <p className="text-base font-bold text-primary">
                      {currentPlan.limits?.storageGb ?? 10} GB
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6 border-secondary bg-secondary/10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 border border-amber-500/20">
                      FREE TIER
                    </span>
                    <span className="text-xs text-tertiary font-medium">No Active Paid Subscription</span>
                  </div>
                  <h2 className="text-xl font-bold text-primary">Select a Plan to Unlock Multi-Manager Quotas</h2>
                  <p className="text-xs text-tertiary max-w-xl">
                    Choose any of the plans below to activate statutory compliance tools, manager seats, and client portals.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Available Subscription Tiers (PhonePe Gateway Checkout) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-primary">Available Upgrade Plans</h2>
                <p className="text-xs text-tertiary">
                  Instantly upgrade or renew using UPI, Cards, or NetBanking via PhonePe
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-tertiary">
                <Zap className="size-3.5 text-purple-500" />
                <span>PhonePe PG Secured</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {plans.map((plan) => {
                const isCurrentPlan = Boolean(
                  (activeSub && activeSub.planId === plan.id) ||
                  (currentPlan && (currentPlan.id === plan.id || currentPlan.slug === plan.slug || currentPlan.name.toLowerCase() === plan.name.toLowerCase()))
                );
                const isLowerTier = Boolean(currentPlan && !isCurrentPlan && plan.price < currentPlan.price);
                const isCheckingOut = checkingOutPlanId === plan.id;

                return (
                  <Card
                    key={plan.id}
                    className={`flex flex-col justify-between p-6 transition-all hover:shadow-md ${
                      isCurrentPlan
                        ? "border-emerald-500/50 ring-1 ring-emerald-500/30 bg-emerald-500/[0.02]"
                        : plan.isPopular
                        ? "border-brand-primary/60 ring-1 ring-brand-primary/30 bg-brand-primary/[0.01]"
                        : ""
                    }`}
                  >
                    <div>
                      {/* Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="rounded-md bg-secondary/40 border border-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary uppercase tracking-wider">
                          {plan.billingCycle}
                        </span>
                        {isCurrentPlan ? (
                          <span className="flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 border border-emerald-500/20">
                            <CheckCircle2 className="size-3" /> Active Plan
                          </span>
                        ) : plan.isPopular ? (
                          <span className="flex items-center gap-1 rounded-md bg-brand-primary/10 px-2 py-0.5 text-[10px] font-semibold text-brand-primary border border-brand-primary/20">
                            <Sparkles className="size-2.5" /> Most Popular
                          </span>
                        ) : null}
                      </div>

                      {/* Name & Price */}
                      <h3 className="text-lg font-bold text-primary">{plan.name}</h3>
                      <p className="text-xs text-tertiary mt-1 min-h-[32px] line-clamp-2">
                        {plan.description}
                      </p>

                      <div className="my-5 flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-primary">
                          {formatCurrency(plan.price)}
                        </span>
                        <span className="text-xs text-tertiary">/ {plan.billingCycle.toLowerCase()}</span>
                      </div>

                      {/* Quotas */}
                      <div className="rounded-xl border border-secondary bg-secondary/10 p-3 space-y-1.5 mb-4 text-xs">
                        <div className="flex justify-between">
                          <span className="text-tertiary">Managers</span>
                          <span className="font-semibold text-primary">Up to {plan.limits?.maxManagers ?? 5}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-tertiary">Clients</span>
                          <span className="font-semibold text-primary">Up to {plan.limits?.maxClients ?? 50}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-tertiary">Storage</span>
                          <span className="font-semibold text-primary">{plan.limits?.storageGb ?? 10} GB</span>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-tertiary">
                          Included:
                        </span>
                        {plan.features.map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-secondary">
                            <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-6 mt-6 border-t border-secondary">
                      {isCurrentPlan ? (
                        <Button
                          size="sm"
                          color="secondary"
                          className="w-full opacity-80 cursor-default bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-semibold"
                          isDisabled={true}
                          iconLeading={<CheckCircle2 className="size-3.5 text-emerald-500" data-icon />}
                        >
                          Current Active Plan
                        </Button>
                      ) : isLowerTier ? (
                        <Button
                          size="sm"
                          color="secondary"
                          className="w-full opacity-60 cursor-not-allowed bg-secondary/30 text-tertiary font-medium"
                          isDisabled={true}
                        >
                          Included in Current Tier
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          color="primary"
                          className="w-full"
                          isDisabled={isCheckingOut || isVerifying}
                          onPress={() => handleCheckout(plan)}
                          iconTrailing={<ArrowRight data-icon />}
                        >
                          {isCheckingOut
                            ? "Connecting PhonePe..."
                            : currentPlan
                            ? `Upgrade (${formatCurrency(plan.price)})`
                            : `Subscribe (${formatCurrency(plan.price)})`}
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Payment Transaction History */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-primary">Billing & Payment History</h2>
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-secondary bg-secondary/30 text-[11px] font-semibold uppercase tracking-wider text-tertiary">
                    <tr>
                      <th className="px-6 py-3.5">Transaction Ref</th>
                      <th className="px-6 py-3.5">Plan Tier</th>
                      <th className="px-6 py-3.5">Amount</th>
                      <th className="px-6 py-3.5">Payment Method</th>
                      <th className="px-6 py-3.5">Date</th>
                      <th className="px-6 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary">
                    {!subData?.transactions || subData.transactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-xs text-tertiary">
                          No payment transactions recorded yet.
                        </td>
                      </tr>
                    ) : (
                      subData.transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-secondary/10 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-primary font-medium">
                            {tx.merchantTransactionId}
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-primary">
                            {tx.plan?.name || "Subscription Plan"}
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-primary">
                            {formatCurrency(tx.amount)}
                          </td>
                          <td className="px-6 py-4 text-xs text-secondary capitalize">
                            {tx.paymentMode || "PhonePe PG (UPI/Cards)"}
                          </td>
                          <td className="px-6 py-4 text-xs text-tertiary">
                            {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-semibold border ${
                                tx.status === "SUCCESS"
                                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                  : tx.status === "PENDING"
                                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                  : "bg-error-primary/10 text-error-primary border-error-primary/20"
                              }`}
                            >
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
