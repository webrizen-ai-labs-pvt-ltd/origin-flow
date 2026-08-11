import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  X,
  UserCheck,
} from "lucide-react";
import { Button, Card, LoadingIndicator } from "@origin-flow/ui";
import { UserService, type UserSummary } from "../services/user-service";
import { useAuthStore } from "../store/auth.store";

export function TeamPage() {
  const { user: currentUser } = useAuthStore();
  const [managers, setManagers] = useState<UserSummary[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const isCompany = currentUser?.role === "COMPANY";

  useEffect(() => {
    loadManagers();
  }, []);

  const loadManagers = async () => {
    setIsLoading(true);
    try {
      const res = await UserService.getUsers({ role: "MANAGER", limit: 50 });
      setManagers(res.data);
    } catch (err) {
      console.error("Failed to load staff managers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateManager = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inviteEmail || !inviteName) return;

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const created = await UserService.createUser({
        email: inviteEmail.trim(),
        name: inviteName.trim(),
        role: "MANAGER",
        companyId: currentUser?.role === "COMPANY" ? currentUser.id : currentUser?.companyId || undefined,
      });

      setManagers((prev) => [created, ...prev]);
      setIsInviteOpen(false);
      setInviteEmail("");
      setInviteName("");
    } catch (err: any) {
      console.error("Failed to create manager:", err);
      setErrorMsg(err.response?.data?.error || "Failed to add manager account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteManager = async (manager: UserSummary) => {
    if (confirm(`Are you sure you want to remove ${manager.name} from your team?`)) {
      try {
        await UserService.deleteUser(manager.id);
        setManagers((prev) => prev.filter((m) => m.id !== manager.id));
      } catch (err: any) {
        alert(err.response?.data?.error || "Failed to remove manager");
      }
    }
  };

  const filteredManagers = managers.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Team & Staff Management</h1>
          <p className="text-sm text-tertiary">
            Manage staff managers, delegate client accounts, and track active team members.
          </p>
        </div>

        {isCompany && (
          <Button
            size="sm"
            color="primary"
            onPress={() => setIsInviteOpen(true)}
            iconLeading={<Plus data-icon />}
          >
            Add Staff Manager
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 size-4 text-tertiary" />
            <input
              type="text"
              placeholder="Search staff managers by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-secondary bg-primary pl-10 pr-4 py-2 text-xs text-primary placeholder:text-tertiary focus:border-brand-primary focus:outline-none"
            />
          </div>
        </div>
      </Card>

      {/* Managers Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-secondary bg-secondary/30 text-[11px] font-semibold uppercase tracking-wider text-tertiary">
              <tr>
                <th className="px-6 py-3.5">Staff Member</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Date Added</th>
                {isCompany && <th className="px-6 py-3.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary">
              {isLoading ? (
                <tr>
                  <td colSpan={isCompany ? 5 : 4} className="py-16 text-center text-tertiary">
                    <LoadingIndicator type="line-spinner" size="md" label="Loading staff team..." />
                  </td>
                </tr>
              ) : filteredManagers.length === 0 ? (
                <tr>
                  <td colSpan={isCompany ? 5 : 4} className="py-16 text-center text-tertiary">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="size-8 text-tertiary/40" />
                      <p className="text-sm font-medium text-primary">No staff managers found</p>
                      <p className="text-xs text-tertiary">Add your first manager to delegate client filings.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredManagers.map((manager) => (
                  <tr key={manager.id} className="hover:bg-secondary/15 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-full bg-blue-500/10 text-xs font-bold text-blue-600">
                          {manager.name ? manager.name[0].toUpperCase() : "M"}
                        </div>
                        <div>
                          <p className="font-semibold text-primary">{manager.name}</p>
                          <p className="text-xs text-tertiary">{manager.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-600">
                        <UserCheck className="size-3" />
                        Staff Manager
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {manager.isVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
                          <CheckCircle2 className="size-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600">
                          <Clock className="size-3" /> Invited
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs text-tertiary">
                      {new Date(manager.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {isCompany && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteManager(manager)}
                          className="rounded-lg p-1.5 text-tertiary hover:bg-error-primary/10 hover:text-error-primary transition-colors"
                          title="Remove Manager"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Manager Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-secondary bg-primary shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-secondary px-6 py-4 bg-secondary/20">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                  <Users className="size-4" />
                </div>
                <h2 className="text-base font-semibold text-primary">Add Staff Manager</h2>
              </div>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="rounded-lg p-1.5 text-tertiary hover:bg-secondary/40 hover:text-primary transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManager} className="p-6 space-y-4">
              {errorMsg && (
                <div className="rounded-xl border border-error_subtle bg-error-primary/10 p-3 text-xs text-error-primary">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary">Manager Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full rounded-xl border border-secondary bg-primary px-3.5 py-2 text-xs text-primary placeholder:text-tertiary focus:border-brand-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="rahul@webrizen.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full rounded-xl border border-secondary bg-primary px-3.5 py-2 text-xs text-primary placeholder:text-tertiary focus:border-brand-primary focus:outline-none"
                />
              </div>

              <p className="text-[11px] text-tertiary">
                A welcome email with login instructions will be sent automatically to this address.
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-secondary">
                <Button
                  color="tertiary"
                  onPress={() => setIsInviteOpen(false)}
                  isDisabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={() => handleCreateManager()}
                  isDisabled={isSubmitting || !inviteName || !inviteEmail}
                >
                  {isSubmitting ? "Adding..." : "Add Staff Manager"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
