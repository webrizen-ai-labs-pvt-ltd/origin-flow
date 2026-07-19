import { useState } from "react";
import { ThemeToggle } from "@origin-flow/ui";
import { Bell, Search, X, Menu } from "lucide-react";
import { useSidebar } from "./sidebar";

export function TopBar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const { toggle } = useSidebar();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-secondary bg-primary/80 px-6 backdrop-blur-xl">
      {/* Left — Mobile menu + Breadcrumb area */}
      <div className="flex items-center gap-3">
        {/* Mobile sidebar toggle (visible on small screens) */}
        <button
          type="button"
          onClick={toggle}
          className="rounded-lg p-2 text-fg-quaternary transition-colors duration-200 hover:bg-primary_hover hover:text-fg-quaternary_hover lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="size-5" />
        </button>

        <div className="hidden items-center gap-2 text-sm sm:flex">
          <span className="text-tertiary">Admin</span>
          <span className="text-quaternary">/</span>
          <span className="font-medium text-primary">Dashboard</span>
        </div>
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-1">
        {/* Search toggle */}
        <div className="relative">
          {searchOpen ? (
            <div className="flex items-center gap-2 animate-in fade-in-0 slide-in-from-right-4 duration-200">
              <input
                autoFocus
                type="text"
                placeholder="Search anything..."
                className="h-9 w-48 rounded-lg border border-secondary bg-primary px-3 text-sm text-primary outline-hidden placeholder:text-placeholder focus:ring-2 focus:ring-brand-solid/20 sm:w-64"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="rounded-lg p-2 text-fg-quaternary transition-colors duration-200 hover:bg-primary_hover"
                aria-label="Close search"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="rounded-lg p-2 text-fg-quaternary transition-colors duration-200 hover:bg-primary_hover hover:text-fg-quaternary_hover"
              aria-label="Search"
            >
              <Search className="size-5" />
            </button>
          )}
        </div>

        {/* Notifications */}
        <button
          type="button"
          className="relative rounded-lg p-2 text-fg-quaternary transition-colors duration-200 hover:bg-primary_hover hover:text-fg-quaternary_hover"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          {/* Notification dot */}
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-error-solid ring-2 ring-primary" />
        </button>

        {/* Theme toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
}
