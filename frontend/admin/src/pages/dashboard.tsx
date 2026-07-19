import { Card } from "@origin-flow/ui";
import {
  Ticket,
  Users,
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Stat card                                                          */
/* ------------------------------------------------------------------ */

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: typeof Ticket;
  iconColor: string;
  iconBg: string;
}

function StatCard({ title, value, change, changeType, icon: Icon, iconColor, iconBg }: StatCardProps) {
  return (
    <Card className="group relative overflow-hidden p-5 transition-shadow duration-300 hover:shadow-md">
      {/* Subtle gradient accent in top-right corner */}
      <div className={`absolute -top-4 -right-4 size-20 rounded-full opacity-10 blur-xl transition-opacity duration-500 group-hover:opacity-20 ${iconBg}`} />

      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-tertiary">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-primary">{value}</p>
          <div className="flex items-center gap-1.5">
            {changeType === "positive" ? (
              <ArrowUpRight className="size-4 text-success-primary" />
            ) : changeType === "negative" ? (
              <ArrowDownRight className="size-4 text-error-primary" />
            ) : null}
            <span
              className={[
                "text-sm font-medium",
                changeType === "positive" ? "text-success-primary" : changeType === "negative" ? "text-error-primary" : "text-tertiary",
              ].join(" ")}
            >
              {change}
            </span>
            <span className="text-xs text-quaternary">vs last month</span>
          </div>
        </div>

        <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`size-5 ${iconColor}`} />
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Activity item                                                      */
/* ------------------------------------------------------------------ */

interface ActivityItem {
  id: number;
  action: string;
  subject: string;
  time: string;
  status: "completed" | "pending" | "alert";
}

const recentActivity: ActivityItem[] = [
  { id: 1, action: "Ticket resolved", subject: "GST Registration — Priya Sharma", time: "2 min ago", status: "completed" },
  { id: 2, action: "New document uploaded", subject: "PAN Card — Rahul Verma", time: "15 min ago", status: "pending" },
  { id: 3, action: "Payment overdue", subject: "Invoice #1048 — Apex Traders", time: "1 hour ago", status: "alert" },
  { id: 4, action: "New client onboarded", subject: "FinCo Solutions Pvt. Ltd.", time: "3 hours ago", status: "completed" },
  { id: 5, action: "Ticket assigned", subject: "ITR Filing — Kavita Enterprises", time: "5 hours ago", status: "pending" },
  { id: 6, action: "Contract generated", subject: "Service Agreement — NovaTech", time: "Yesterday", status: "completed" },
];

const statusConfig = {
  completed: { icon: CheckCircle2, color: "text-success-primary", bg: "bg-success-secondary" },
  pending: { icon: Clock, color: "text-warning-primary", bg: "bg-warning-secondary" },
  alert: { icon: AlertCircle, color: "text-error-primary", bg: "bg-error-secondary" },
};

/* ------------------------------------------------------------------ */
/*  Quick action card                                                  */
/* ------------------------------------------------------------------ */

interface QuickAction {
  label: string;
  description: string;
  icon: typeof Ticket;
  color: string;
  bg: string;
}

const quickActions: QuickAction[] = [
  { label: "New Ticket", description: "Create a service request", icon: Ticket, color: "text-fg-brand-secondary", bg: "bg-brand-section" },
  { label: "Add Client", description: "Onboard a new client", icon: Users, color: "text-success-primary", bg: "bg-success-secondary" },
  { label: "Generate Invoice", description: "Create a payment invoice", icon: FileText, color: "text-warning-primary", bg: "bg-warning-secondary" },
];

/* ------------------------------------------------------------------ */
/*  Dashboard page                                                     */
/* ------------------------------------------------------------------ */

export function DashboardPage() {
  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Dashboard</h1>
        <p className="mt-1 text-sm text-tertiary">
          Welcome back, John. Here's what's happening with your practice today.
        </p>
      </div>

      {/* ── Stat cards grid ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Active Tickets"
          value="48"
          change="+12.5%"
          changeType="positive"
          icon={Ticket}
          iconColor="text-fg-brand-secondary"
          iconBg="bg-brand-section"
        />
        <StatCard
          title="Total Clients"
          value="264"
          change="+4.2%"
          changeType="positive"
          icon={Users}
          iconColor="text-success-primary"
          iconBg="bg-success-secondary"
        />
        <StatCard
          title="Revenue (MTD)"
          value="₹4,28,500"
          change="+18.3%"
          changeType="positive"
          icon={CreditCard}
          iconColor="text-warning-primary"
          iconBg="bg-warning-secondary"
        />
        <StatCard
          title="Overdue Invoices"
          value="7"
          change="-3"
          changeType="negative"
          icon={TrendingUp}
          iconColor="text-error-primary"
          iconBg="bg-error-secondary"
        />
      </div>

      {/* ── Two-column layout: Activity + Quick Actions ── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Activity feed — takes 2/3 */}
        <Card className="xl:col-span-2 p-0! overflow-hidden">
          <div className="flex items-center justify-between border-b border-secondary px-5 py-4">
            <h2 className="text-sm font-semibold text-primary">Recent Activity</h2>
            <button
              type="button"
              className="text-xs font-medium text-brand-secondary transition-colors hover:text-brand-secondary_hover"
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-secondary">
            {recentActivity.map((item) => {
              const cfg = statusConfig[item.status];
              const StatusIcon = cfg.icon;

              return (
                <div
                  key={item.id}
                  className="group flex items-center gap-4 px-5 py-3.5 transition-colors duration-150 hover:bg-primary_hover"
                >
                  <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${cfg.bg}`}>
                    <StatusIcon className={`size-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary">{item.action}</p>
                    <p className="truncate text-xs text-tertiary">{item.subject}</p>
                  </div>
                  <span className="shrink-0 text-xs text-quaternary">{item.time}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Quick actions — takes 1/3 */}
        <Card className="p-0! overflow-hidden">
          <div className="border-b border-secondary px-5 py-4">
            <h2 className="text-sm font-semibold text-primary">Quick Actions</h2>
          </div>
          <div className="space-y-2 p-4">
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                className="group flex w-full items-center gap-3.5 rounded-xl px-4 py-3.5 text-left transition-all duration-200 hover:bg-primary_hover hover:shadow-xs"
              >
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${action.bg} transition-transform duration-200 group-hover:scale-110`}>
                  <action.icon className={`size-5 ${action.color}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary">{action.label}</p>
                  <p className="text-xs text-tertiary">{action.description}</p>
                </div>
              </button>
            ))}
          </div>

          {/* ── Progress section ── */}
          <div className="border-t border-secondary px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-tertiary">Monthly target</span>
              <span className="text-xs font-semibold text-primary">72%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-quaternary">
              <div
                className="h-full rounded-full bg-brand-solid transition-all duration-1000 ease-out"
                style={{ width: "72%" }}
              />
            </div>
            <p className="mt-2 text-[11px] text-quaternary">
              36 of 50 tickets resolved this month
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
