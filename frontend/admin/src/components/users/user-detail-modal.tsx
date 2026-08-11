import { useState, useEffect } from "react";
import {
  X,
  Building2,
  CheckCircle2,
  Clock,
  KeyRound,
  Laptop,
  Trash2,
  Users,
} from "lucide-react";
import { Button, LoadingIndicator } from "@origin-flow/ui";
import {
  UserService,
  type UserSummary,
  type SessionItem,
} from "../../services/user-service";

interface UserDetailModalProps {
  isOpen: boolean;
  userId: string | null;
  onClose: () => void;
  onUserUpdated?: (user: UserSummary) => void;
}

export function UserDetailModal({
  isOpen,
  userId,
  onClose,
  onUserUpdated,
}: UserDetailModalProps) {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "sessions" | "subordinates">("overview");

  useEffect(() => {
    if (isOpen && userId) {
      loadUserDetails(userId);
      loadSessions(userId);
    }
  }, [isOpen, userId]);

  const loadUserDetails = async (id: string) => {
    try {
      setIsLoading(true);
      const data = await UserService.getUserById(id);
      setUser(data);
    } catch (e) {
      console.error("Failed to load user details", e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSessions = async (id: string) => {
    try {
      setIsLoadingSessions(true);
      const list = await UserService.getSessions(id);
      setSessions(list);
    } catch (e) {
      console.error("Failed to load sessions", e);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!userId) return;
    try {
      setRevokingSessionId(sessionId);
      await UserService.revokeSession(userId, sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (e) {
      console.error("Failed to revoke session", e);
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleApprove = async () => {
    if (!user) return;
    try {
      const updated = await UserService.approveUser(user.id);
      setUser((prev) => (prev ? { ...prev, isVerified: true } : prev));
      if (onUserUpdated) onUserUpdated(updated);
    } catch (e) {
      console.error("Failed to approve user", e);
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-0.5 text-xs font-semibold text-purple-600 dark:text-purple-400 border border-purple-500/20">Admin</span>;
      case "COMPANY":
        return <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">Company</span>;
      case "MANAGER":
        return <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">Manager</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Client</span>;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-xs animate-in fade-in-0 duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl border border-secondary bg-primary shadow-2xl transition-all my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-secondary px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand-solid/10 text-brand-secondary font-bold">
              {user?.name ? user.name[0].toUpperCase() : "U"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-primary">{user?.name || "Loading..."}</h2>
                {user && getRoleBadge(user.role)}
              </div>
              <p className="text-xs text-tertiary">{user?.email || "..."}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user && !user.isVerified && (
              <Button color="primary" size="sm" onPress={handleApprove}>
                <CheckCircle2 className="size-3.5 mr-1" />
                Approve User
              </Button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-fg-quaternary hover:bg-primary_hover hover:text-secondary transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-secondary px-6 bg-secondary/20">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={[
              "px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer",
              activeTab === "overview"
                ? "border-brand-solid text-brand-secondary"
                : "border-transparent text-tertiary hover:text-secondary",
            ].join(" ")}
          >
            Overview & Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sessions")}
            className={[
              "flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer",
              activeTab === "sessions"
                ? "border-brand-solid text-brand-secondary"
                : "border-transparent text-tertiary hover:text-secondary",
            ].join(" ")}
          >
            <Laptop className="size-3.5" />
            <span>Active Sessions</span>
            <span className="rounded-full bg-secondary px-1.5 py-0.2 text-[10px] text-tertiary">
              {sessions.length}
            </span>
          </button>
          {user?.role === "COMPANY" && (
            <button
              type="button"
              onClick={() => setActiveTab("subordinates")}
              className={[
                "flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer",
                activeTab === "subordinates"
                  ? "border-brand-solid text-brand-secondary"
                  : "border-transparent text-tertiary hover:text-secondary",
              ].join(" ")}
            >
              <Users className="size-3.5" />
              <span>Subordinates</span>
              <span className="rounded-full bg-secondary px-1.5 py-0.2 text-[10px] text-tertiary">
                {user.subordinates?.length || 0}
              </span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <LoadingIndicator type="line-spinner" size="md" label="Fetching user information..." />
            </div>
          ) : user ? (
            activeTab === "overview" ? (
              <div className="space-y-6">
                {/* Status & Contact Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-secondary bg-primary p-4 space-y-1">
                    <span className="text-[11px] font-medium text-tertiary uppercase">Verification Status</span>
                    <div className="flex items-center gap-1.5">
                      {user.isVerified ? (
                        <>
                          <CheckCircle2 className="size-4 text-emerald-500" />
                          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Verified</span>
                        </>
                      ) : (
                        <>
                          <Clock className="size-4 text-amber-500" />
                          <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">Pending Approval</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-secondary bg-primary p-4 space-y-1">
                    <span className="text-[11px] font-medium text-tertiary uppercase">Phone Number</span>
                    <p className="text-sm font-semibold text-primary">{user.phone || "Not provided"}</p>
                  </div>

                  <div className="rounded-xl border border-secondary bg-primary p-4 space-y-1">
                    <span className="text-[11px] font-medium text-tertiary uppercase">Joined On</span>
                    <p className="text-sm font-semibold text-primary">
                      {new Date(user.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Hierarchy Info (Parent Company) */}
                {user.company && (
                  <div className="rounded-xl border border-secondary bg-secondary/20 p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary mb-2">
                      Linked Parent Organization
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building2 className="size-5 text-brand-secondary" />
                        <div>
                          <p className="text-sm font-semibold text-primary">{user.company.name}</p>
                          <p className="text-xs text-tertiary">{user.company.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Company Compliance Profile */}
                {user.companyProfile && (
                  <div className="rounded-xl border border-secondary bg-primary p-5 space-y-4">
                    <div className="flex items-center gap-2 border-b border-secondary pb-3">
                      <Building2 className="size-5 text-brand-secondary" />
                      <h3 className="text-sm font-semibold text-primary">Corporate & Tax Compliance Profile</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div>
                        <span className="text-[11px] text-tertiary">Company Name</span>
                        <p className="text-xs font-semibold text-primary">{user.companyProfile.companyName}</p>
                      </div>
                      <div>
                        <span className="text-[11px] text-tertiary">PAN</span>
                        <p className="text-xs font-mono font-semibold text-primary">{user.companyProfile.pan || "—"}</p>
                      </div>
                      <div>
                        <span className="text-[11px] text-tertiary">GSTIN</span>
                        <p className="text-xs font-mono font-semibold text-primary">{user.companyProfile.gstin || "—"}</p>
                      </div>
                      <div>
                        <span className="text-[11px] text-tertiary">UDIN</span>
                        <p className="text-xs font-mono font-semibold text-primary">{user.companyProfile.udin || "—"}</p>
                      </div>
                      <div>
                        <span className="text-[11px] text-tertiary">FRN</span>
                        <p className="text-xs font-mono font-semibold text-primary">{user.companyProfile.frn || "—"}</p>
                      </div>
                      <div>
                        <span className="text-[11px] text-tertiary">DIN</span>
                        <p className="text-xs font-mono font-semibold text-primary">{user.companyProfile.din || "—"}</p>
                      </div>
                      <div>
                        <span className="text-[11px] text-tertiary">TAN</span>
                        <p className="text-xs font-mono font-semibold text-primary">{user.companyProfile.tan || "—"}</p>
                      </div>
                      <div>
                        <span className="text-[11px] text-tertiary">Address</span>
                        <p className="text-xs text-primary truncate">{user.companyProfile.address || "—"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Passkeys Overview */}
                <div className="rounded-xl border border-secondary bg-primary p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-secondary pb-3">
                    <div className="flex items-center gap-2">
                      <KeyRound className="size-5 text-brand-secondary" />
                      <h3 className="text-sm font-semibold text-primary">WebAuthn Security Keys / Passkeys</h3>
                    </div>
                    <span className="text-xs font-medium text-tertiary">
                      {user.passkeys?.length || 0} registered
                    </span>
                  </div>

                  {!user.passkeys || user.passkeys.length === 0 ? (
                    <p className="text-xs text-tertiary py-2">No biometric passkeys registered for this account.</p>
                  ) : (
                    <div className="space-y-2">
                      {user.passkeys.map((pk) => (
                        <div
                          key={pk.id}
                          className="flex items-center justify-between rounded-lg border border-secondary bg-secondary/10 px-3.5 py-2.5"
                        >
                          <div className="flex items-center gap-3">
                            <KeyRound className="size-4 text-emerald-500" />
                            <div>
                              <p className="text-xs font-medium text-primary">
                                Device Type: <span className="font-semibold">{pk.credentialDeviceType || "Platform"}</span>
                              </p>
                              <p className="text-[11px] text-tertiary">
                                Added on {new Date(pk.createdAt).toLocaleDateString("en-IN")} • Backed up:{" "}
                                {pk.credentialBackedUp ? "Yes" : "No"}
                              </p>
                            </div>
                          </div>
                          <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500 border border-emerald-500/20">
                            Active Passkey
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === "sessions" ? (
              /* Active Sessions Tab */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-primary">Active Login Sessions</h3>
                    <p className="text-xs text-tertiary">
                      All valid browser and device tokens currently authenticated for this account.
                    </p>
                  </div>
                </div>

                {isLoadingSessions ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingIndicator type="line-spinner" size="sm" label="Loading active sessions..." />
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="rounded-xl border border-secondary bg-secondary/10 p-8 text-center text-xs text-tertiary">
                    No active sessions found.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {sessions.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-xl border border-secondary bg-primary p-4 transition-all hover:bg-secondary/10"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="flex size-9 items-center justify-center rounded-lg bg-secondary/40 text-secondary">
                            <Laptop className="size-4" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-primary max-w-md truncate">
                              {s.device || "Unknown browser session"}
                            </p>
                            <p className="text-[11px] text-tertiary">
                              Created: {new Date(s.createdAt).toLocaleString("en-IN")} • Expires:{" "}
                              {new Date(s.expiresAt).toLocaleDateString("en-IN")}
                            </p>
                          </div>
                        </div>

                        <Button
                          color="tertiary-destructive"
                          size="sm"
                          onPress={() => handleRevokeSession(s.id)}
                          isLoading={revokingSessionId === s.id}
                        >
                          <Trash2 className="size-3.5 mr-1" />
                          Revoke
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Subordinates Tab */
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-primary">Subordinate Team Members & Clients</h3>
                  <p className="text-xs text-tertiary">
                    Managers and clients associated with this company.
                  </p>
                </div>

                {!user.subordinates || user.subordinates.length === 0 ? (
                  <div className="rounded-xl border border-secondary bg-secondary/10 p-8 text-center text-xs text-tertiary">
                    No subordinate users linked to this company yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {user.subordinates.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between rounded-xl border border-secondary bg-primary p-3.5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 items-center justify-center rounded-full bg-brand-solid/10 text-xs font-bold text-brand-secondary">
                            {sub.name[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-primary">{sub.name}</p>
                            <p className="text-[11px] text-tertiary">{sub.email}</p>
                          </div>
                        </div>
                        {getRoleBadge(sub.role)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="py-12 text-center text-xs text-tertiary">User not found</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-secondary px-6 py-4 shrink-0">
          <Button color="secondary" size="md" onPress={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
