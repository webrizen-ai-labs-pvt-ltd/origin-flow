import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Building2,
  UserCheck,
  Search,
  RefreshCw,
  Eye,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  Shield,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Button, Card, Pagination, LoadingIndicator } from "@origin-flow/ui";
import { UserService, type UserSummary, type FetchUsersParams } from "../services/user-service";
import { useAuthStore } from "../store/auth.store";
import { CreateUserModal } from "../components/users/create-user-modal";
import { EditUserModal } from "../components/users/edit-user-modal";
import { UserDetailModal } from "../components/users/user-detail-modal";
import { DeleteUserModal } from "../components/users/delete-user-modal";

export function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const isAdmin = currentUser?.role === "ADMIN";

  // State
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<string | null>(null);
  const [userToEdit, setUserToEdit] = useState<UserSummary | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserSummary | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMsg("");

      const params: FetchUsersParams = {
        page: currentPage,
        limit: pageSize,
      };

      if (debouncedSearch) params.search = debouncedSearch;
      if (selectedRole) params.role = selectedRole;
      if (selectedStatus === "verified") params.isVerified = true;
      if (selectedStatus === "pending") params.isVerified = false;

      const res = await UserService.getUsers(params);
      setUsers(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalUsers(res.pagination.total);
    } catch (e: any) {
      console.error("Failed to load users", e);
      setErrorMsg(e.response?.data?.error || "Failed to load users. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, selectedRole, selectedStatus]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleQuickApprove = async (id: string) => {
    try {
      const updated = await UserService.approveUser(id);
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    } catch (e) {
      console.error("Failed to approve user", e);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-0.5 text-xs font-semibold text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Shield className="size-3" />
            Admin
          </span>
        );
      case "COMPANY":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Building2 className="size-3" />
            Company
          </span>
        );
      case "MANAGER":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Manager
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Client
          </span>
        );
    }
  };

  // Metric counts
  const companiesCount = users.filter((u) => u.role === "COMPANY").length;
  const pendingCount = users.filter((u) => !u.isVerified).length;
  const managersCount = users.filter((u) => u.role === "MANAGER").length;
  const clientsCount = users.filter((u) => u.role === "CLIENT").length;

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">User Management</h1>
          <p className="mt-1 text-sm text-tertiary">
            Manage organization accounts, staff roles, client relationships, and verification approvals.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button color="secondary" size="md" onPress={loadUsers} isLoading={isLoading} iconLeading={<RefreshCw className="size-4" />}>
            Refresh
          </Button>
          {isAdmin && (
            <Button color="primary" size="md" onPress={() => setIsCreateOpen(true)}>
              Add User
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Card className="p-4! border-secondary bg-primary">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-tertiary uppercase">Total Users</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary-solid/10 text-primary">
              <Users className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-primary">{totalUsers}</p>
        </Card>

        <Card className="p-4! border-secondary bg-primary">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-tertiary uppercase">Companies</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Building2 className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-primary">{companiesCount}</p>
        </Card>

        <Card className="p-4! border-secondary bg-primary">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-tertiary uppercase">Managers</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Shield className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-primary">{managersCount}</p>
        </Card>

        <Card className="p-4! border-secondary bg-primary">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-tertiary uppercase">Clients</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <UserCheck className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-primary">{clientsCount}</p>
        </Card>

        <Card className="p-4! border-secondary bg-primary">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-tertiary uppercase">Pending Approvals</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Clock className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingCount}</p>
        </Card>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl border border-secondary bg-primary shadow-xs overflow-hidden">
        {/* Filters and Search Bar */}
        <div className="flex flex-col gap-3 border-b border-secondary p-4 sm:flex-row sm:items-center sm:justify-between bg-secondary/10">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-quaternary" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-secondary bg-primary pl-9 pr-3 py-2 text-sm text-primary placeholder:text-placeholder focus:border-brand-solid focus:outline-hidden focus:ring-1 focus:ring-brand-solid"
            />
          </div>

          <div className="flex items-center gap-2.5">
            {/* Role Filter */}
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-secondary bg-primary px-3 py-2 text-xs font-medium text-secondary focus:border-brand-solid focus:outline-hidden"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="COMPANY">Company</option>
              <option value="MANAGER">Manager</option>
              <option value="CLIENT">Client</option>
            </select>

            {/* Verification Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-secondary bg-primary px-3 py-2 text-xs font-medium text-secondary focus:border-brand-solid focus:outline-hidden"
            >
              <option value="">All Statuses</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending Approval</option>
            </select>
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="m-4 flex items-center gap-2 rounded-lg border border-error_subtle bg-error-primary/10 p-3 text-sm text-error-primary">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-secondary bg-secondary/30 text-[11px] font-semibold uppercase tracking-wider text-tertiary">
              <tr>
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Plan Tier</th>
                <th className="px-6 py-3.5">Organization</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Joined</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-tertiary">
                    <LoadingIndicator type="line-spinner" size="md" label="Loading user accounts..." />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-tertiary">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="size-8 text-fg-quaternary" />
                      <p className="text-sm font-medium text-primary">No users found</p>
                      <p className="text-xs text-tertiary">Try clearing your search query or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const companyName =
                    u.role === "COMPANY"
                      ? u.companyProfile?.companyName || u.name
                      : u.company?.name || "—";

                  const activePlan = u.activeSubscription?.plan || u.company?.subscriptions?.[0]?.plan;

                  return (
                    <tr key={u.id} className="transition-colors hover:bg-secondary/15">
                      {/* User Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {u.avatarUrl ? (
                            <img
                              src={u.avatarUrl}
                              alt={u.name}
                              className="size-9 rounded-full object-cover border border-secondary"
                            />
                          ) : (
                            <div className="flex size-9 items-center justify-center rounded-full bg-brand-solid/10 text-xs font-bold text-brand-secondary">
                              {u.name ? u.name[0].toUpperCase() : "U"}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-primary">{u.name}</p>
                            <p className="text-xs text-tertiary">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role Column */}
                      <td className="px-6 py-4">{getRoleBadge(u.role)}</td>

                      {/* Plan Tier Column */}
                      <td className="px-6 py-4">
                        {u.role === "COMPANY" ? (
                          u.activeSubscription?.plan ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-brand-primary/10 border border-brand-primary/20 px-2 py-0.5 text-[11px] font-semibold text-brand-primary">
                              <Sparkles className="size-3" />
                              {u.activeSubscription.plan.name}
                            </span>
                          ) : (
                            <span className="rounded-md bg-secondary/40 border border-secondary px-1.5 py-0.5 text-[10px] text-tertiary">
                              Free Tier
                            </span>
                          )
                        ) : activePlan ? (
                          <span className="text-xs text-secondary font-medium">
                            {activePlan.name}
                          </span>
                        ) : (
                          <span className="text-xs text-tertiary">—</span>
                        )}
                      </td>

                      {/* Organization Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-secondary">
                          {u.role === "COMPANY" && <Building2 className="size-3.5 text-blue-500 shrink-0" />}
                          <span className="truncate max-w-[160px]">{companyName}</span>
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="px-6 py-4">
                        {u.isVerified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="size-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                            <Clock className="size-3" />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="px-6 py-4 text-xs text-tertiary">
                        {new Date(u.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Approve button if pending */}
                          {!u.isVerified && isAdmin && (
                            <Button
                              color="tertiary"
                              size="xs"
                              iconLeading={<CheckCircle2 data-icon />}
                              aria-label="Approve User"
                              onPress={() => handleQuickApprove(u.id)} />
                          )}

                          {/* Inspect / View */}
                          <Button
                            aria-label="Inspect User Details"
                            size="xs"
                            color="tertiary"
                            iconLeading={<Eye data-icon />}
                            onPress={() => setSelectedUserForDetail(u.id)}
                          />

                          {/* Edit User */}
                          <Button
                            aria-label="Edit User"
                            size="xs"
                            color="tertiary"
                            iconLeading={<Edit3 data-icon />}
                            onPress={() => setUserToEdit(u)}
                          />

                          {/* Delete User (Admin only) */}
                          {isAdmin && (
                            <Button
                              aria-label="Delete User"
                              size="xs"
                              color="tertiary"
                              iconLeading={<Trash2 data-icon />}
                              onPress={() => setUserToDelete(u)}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Pagination */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-secondary p-4 sm:flex-row bg-secondary/10">
          <div className="flex items-center gap-3 text-xs text-tertiary">
            <span>
              Showing <span className="font-semibold text-primary">{users.length}</span> of{" "}
              <span className="font-semibold text-primary">{totalUsers}</span> users
            </span>
            <div className="flex items-center gap-1.5">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded border border-secondary bg-primary px-2 py-1 text-xs text-primary focus:outline-hidden"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Modals */}
      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(created) => {
          setUsers((prev) => [created, ...prev]);
          setTotalUsers((prev) => prev + 1);
        }}
      />

      <EditUserModal
        isOpen={!!userToEdit}
        user={userToEdit}
        onClose={() => setUserToEdit(null)}
        onSuccess={(updated) => {
          setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        }}
      />

      <UserDetailModal
        isOpen={!!selectedUserForDetail}
        userId={selectedUserForDetail}
        onClose={() => setSelectedUserForDetail(null)}
        onUserUpdated={(updated) => {
          setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        }}
      />

      <DeleteUserModal
        isOpen={!!userToDelete}
        user={userToDelete}
        onClose={() => setUserToDelete(null)}
        onSuccess={(deletedId) => {
          setUsers((prev) => prev.filter((u) => u.id !== deletedId));
          setTotalUsers((prev) => Math.max(0, prev - 1));
        }}
      />
    </div>
  );
}
