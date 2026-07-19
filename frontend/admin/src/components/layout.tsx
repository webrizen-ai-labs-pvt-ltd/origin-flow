import { Outlet } from "react-router-dom";

export function Layout() {
  return (
    <div className="min-h-screen relative flex flex-col bg-primary text-primary">
      <Outlet />
    </div>
  );
}
