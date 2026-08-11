import { useState, useEffect } from "react";
import {
  Briefcase,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  X,
} from "lucide-react";
import { Button, Card, LoadingIndicator } from "@origin-flow/ui";
import { UserService, type UserSummary } from "../services/user-service";
import { useAuthStore } from "../store/auth.store";

export function ClientsPage() {
  const { user: currentUser } = useAuthStore();
  const [clients, setClients] = useState<UserSummary[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [clientEmail, setClientEmail] = useState("");
  const [clientName, setClientName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const isCompany = currentUser?.role === "COMPANY";

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const res = await UserService.getUsers({ role: "CLIENT", limit: 100 });
      setClients(res.data);
    } catch (err) {
      console.error("Failed to load clients:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClient = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!clientEmail || !clientName) return;

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const created = await UserService.createUser({
        email: clientEmail.trim(),
        name: clientName.trim(),
        role: "CLIENT",
        companyId: currentUser?.role === "COMPANY" ? currentUser.id : currentUser?.companyId || undefined,
      });

      setClients((prev) => [created, ...prev]);
      setIsAddOpen(false);
      setClientEmail("");
      setClientName("");
    } catch (err: any) {
      console.error("Failed to create client:", err);
      setErrorMsg(err.response?.data?.error || "Failed to add client account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async (client: UserSummary) => {
    if (confirm(`Are you sure you want to delete client "${client.name}"?`)) {
      try {
        await UserService.deleteUser(client.id);
        setClients((prev) => prev.filter((c) => c.id !== client.id));
      } catch (err: any) {
        alert(err.response?.data?.error || "Failed to delete client");
      }
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Client Accounts Directory</h1>
          <p className="text-sm text-tertiary">
            Manage your firm's onboarded clients, access compliance files, and track client portal statuses.
          </p>
        </div>

        <Button
          size="sm"
          color="primary"
          onPress={() => setIsAddOpen(true)}
          iconLeading={<Plus data-icon />}
        >
          Add Client Account
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 size-4 text-tertiary" />
            <input
              type="text"
              placeholder="Search clients by entity name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-secondary bg-primary pl-10 pr-4 py-2 text-xs text-primary placeholder:text-tertiary focus:border-brand-primary focus:outline-none"
            />
          </div>
        </div>
      </Card>

      {/* Clients Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-secondary bg-secondary/30 text-[11px] font-semibold uppercase tracking-wider text-tertiary">
              <tr>
                <th className="px-6 py-3.5">Client / Entity</th>
                <th className="px-6 py-3.5">Access Level</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Joined</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-tertiary">
                    <LoadingIndicator type="line-spinner" size="md" label="Loading client directory..." />
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-tertiary">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Briefcase className="size-8 text-tertiary/40" />
                      <p className="text-sm font-medium text-primary">No client accounts found</p>
                      <p className="text-xs text-tertiary">Enrol your first client to start handling compliance filings.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-secondary/15 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-full bg-purple-500/10 text-xs font-bold text-purple-600">
                          {client.name ? client.name[0].toUpperCase() : "C"}
                        </div>
                        <div>
                          <p className="font-semibold text-primary">{client.name}</p>
                          <p className="text-xs text-tertiary">{client.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-xs font-medium text-purple-600">
                        <Briefcase className="size-3" /> Client Portal
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {client.isVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
                          <CheckCircle2 className="size-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600">
                          <Clock className="size-3" /> Pending Verification
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs text-tertiary">
                      {new Date(client.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isCompany && (
                          <button
                            onClick={() => handleDeleteClient(client)}
                            className="rounded-lg p-1.5 text-tertiary hover:bg-error-primary/10 hover:text-error-primary transition-colors"
                            title="Delete Client"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Client Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-secondary bg-primary shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-secondary px-6 py-4 bg-secondary/20">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
                  <Briefcase className="size-4" />
                </div>
                <h2 className="text-base font-semibold text-primary">Enrol Client Account</h2>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="rounded-lg p-1.5 text-tertiary hover:bg-secondary/40 hover:text-primary transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="p-6 space-y-4">
              {errorMsg && (
                <div className="rounded-xl border border-error_subtle bg-error-primary/10 p-3 text-xs text-error-primary">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary">Client / Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Tech Pvt Ltd"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full rounded-xl border border-secondary bg-primary px-3.5 py-2 text-xs text-primary placeholder:text-tertiary focus:border-brand-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary">Primary Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="contact@acmetech.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full rounded-xl border border-secondary bg-primary px-3.5 py-2 text-xs text-primary placeholder:text-tertiary focus:border-brand-primary focus:outline-none"
                />
              </div>

              <p className="text-[11px] text-tertiary">
                Your client will receive a welcome email with a portal invite link to upload required compliance documents.
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-secondary">
                <Button
                  color="tertiary"
                  onPress={() => setIsAddOpen(false)}
                  isDisabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={() => handleCreateClient()}
                  isDisabled={isSubmitting || !clientName || !clientEmail}
                >
                  {isSubmitting ? "Enrolling..." : "Enrol Client"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
