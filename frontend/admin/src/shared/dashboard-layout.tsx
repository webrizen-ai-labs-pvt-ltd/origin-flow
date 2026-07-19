import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/sidebar";
import { TopBar } from "../components/top-bar";

export function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-secondary">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
