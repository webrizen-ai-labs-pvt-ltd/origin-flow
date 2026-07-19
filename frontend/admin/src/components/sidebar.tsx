import { useState, createContext, useContext } from "react";
import {
  LayoutDashboard,
  Ticket,
  Users,
  FolderOpen,
  Settings,
  CreditCard,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
  HelpCircle,
} from "lucide-react";
import { NavLink } from "react-router-dom";

/* ------------------------------------------------------------------ */
/*  Sidebar context — lets children read collapsed state              */
/* ------------------------------------------------------------------ */

interface SidebarContextValue {
  isCollapsed: boolean;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  isCollapsed: false,
  toggle: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

/* ------------------------------------------------------------------ */
/*  Navigation items                                                   */
/* ------------------------------------------------------------------ */

interface NavItem {
  label: string;
  icon: typeof LayoutDashboard;
  to: string;
  badge?: string | number;
}

const mainNavItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Tickets", icon: Ticket, to: "/dashboard/tickets", badge: 12 },
  { label: "Clients", icon: Users, to: "/dashboard/clients" },
  { label: "Documents", icon: FolderOpen, to: "/dashboard/documents" },
  { label: "Payments", icon: CreditCard, to: "/dashboard/payments", badge: 3 },
  { label: "Analytics", icon: BarChart3, to: "/dashboard/analytics" },
];

const bottomNavItems: NavItem[] = [
  { label: "Help & Support", icon: HelpCircle, to: "/dashboard/support" },
  { label: "Settings", icon: Settings, to: "/dashboard/settings" },
];

/* ------------------------------------------------------------------ */
/*  Sidebar link                                                       */
/* ------------------------------------------------------------------ */

function SidebarLink({ item, isCollapsed }: { item: NavItem; isCollapsed: boolean }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === "/dashboard"}
      className={({ isActive }) =>
        [
          "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out",
          isActive
            ? "bg-brand-section text-white shadow-xs"
            : "text-tertiary hover:bg-primary_hover hover:text-secondary",
          isCollapsed ? "justify-center px-2.5" : "",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          {/* Active indicator bar */}
          <span
            className={[
              "absolute top-1/2 left-0 h-5 w-0.75 -translate-y-1/2 rounded-r-full bg-brand-solid transition-all duration-300",
              isActive ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0",
            ].join(" ")}
          />

          <item.icon
            className={[
              "size-5 shrink-0 transition-colors duration-200",
              isActive ? "text-white" : "text-fg-quaternary group-hover:text-fg-quaternary_hover",
            ].join(" ")}
          />

          {!isCollapsed && (
            <>
              <span className="flex-1 truncate">{item.label}</span>

              {item.badge !== undefined && (
                <span
                  className={[
                    "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums",
                    isActive
                      ? "bg-brand-solid text-white"
                      : "bg-quaternary text-secondary",
                  ].join(" ")}
                >
                  {item.badge}
                </span>
              )}
            </>
          )}

          {/* Tooltip when collapsed */}
          {isCollapsed && (
            <span className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-lg bg-primary-solid px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
              {item.label}
              {item.badge !== undefined && (
                <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
                  {item.badge}
                </span>
              )}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Sidebar component                                             */
/* ------------------------------------------------------------------ */

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggle = () => setIsCollapsed((prev) => !prev);

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggle }}>
      <aside
        className={[
          "group/sidebar relative flex h-screen flex-col border-r border-secondary bg-primary transition-all duration-300 ease-out",
          isCollapsed ? "w-17" : "w-66",
        ].join(" ")}
      >
        {/* ── Logo / Brand ── */}
        <div className={["flex h-16 items-center border-b border-secondary px-4", isCollapsed ? "justify-center" : "gap-3"].join(" ")}>
          <img src="/logo.png" alt="Origin Flow" className="size-8 dark:invert" />
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-semibold text-primary">Origin Flow</span>
              <span className="truncate text-xs text-tertiary">Admin Panel</span>
            </div>
          )}
        </div>

        {/* ── Main navigation ── */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-hide">
          <div className={["mb-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-quaternary transition-opacity duration-200", isCollapsed ? "opacity-0" : "opacity-100"].join(" ")}>
            Menu
          </div>
          {mainNavItems.map((item) => (
            <SidebarLink key={item.to} item={item} isCollapsed={isCollapsed} />
          ))}
        </nav>

        {/* ── Bottom section ── */}
        <div className="border-t border-secondary px-3 py-3 space-y-1">
          {bottomNavItems.map((item) => (
            <SidebarLink key={item.to} item={item} isCollapsed={isCollapsed} />
          ))}
        </div>

        {/* ── User profile ── */}
        <div className={["flex items-center border-t border-secondary px-4 py-3", isCollapsed ? "justify-center" : "gap-3"].join(" ")}>
          <div className="relative shrink-0">
            <div className="flex size-9 items-center justify-center rounded-full bg-brand-section text-sm font-semibold text-white">
              JD
            </div>
            {/* Online indicator */}
            <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-primary bg-success-solid" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-1 items-center gap-2 overflow-hidden">
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-primary">John Doe</p>
                <p className="truncate text-xs text-tertiary">john@originflow.com</p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-md p-1.5 text-fg-quaternary transition-colors duration-200 hover:bg-primary_hover hover:text-fg-quaternary_hover"
                aria-label="Sign out"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          )}
        </div>

        {/* ── Collapse toggle ── */}
        <button
          type="button"
          onClick={toggle}
          className={[
            "absolute -right-3 top-20 z-10 flex size-6 items-center justify-center rounded-full border border-secondary bg-primary shadow-sm transition-all duration-300 ease-out",
            "hover:bg-primary_hover hover:shadow-md",
            "opacity-0 group-hover/sidebar:opacity-100",
          ].join(" ")}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="size-3.5 text-fg-quaternary" />
          ) : (
            <ChevronLeft className="size-3.5 text-fg-quaternary" />
          )}
        </button>
      </aside>
    </SidebarContext.Provider>
  );
}
