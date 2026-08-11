import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/auth.store";
import { DashboardLayout } from "./components/dashboard-layout";
import { DashboardPage } from "./pages/dashboard";
import { TeamPage } from "./pages/team";
import { ClientsPage } from "./pages/clients";
import { BillingPage } from "./pages/billing";
import { SettingsPage } from "./pages/settings";
import { SignInPage } from "./pages/sign-in";
import { NotFoundPage } from "./pages/not-found";
import { ErrorBoundaryPage } from "./pages/error";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }

  return <>{children}</>;
}

function RoleRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: Array<"ADMIN" | "COMPANY" | "MANAGER" | "CLIENT">;
}) {
  const user = useAuthStore((state) => state.user);

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

const router = createBrowserRouter([
  {
    path: "/",
    errorElement: <ErrorBoundaryPage />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "sign-in",
        element: <SignInPage />,
      },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: "team",
            element: <TeamPage />,
          },
          {
            path: "clients",
            element: <ClientsPage />,
          },
          {
            path: "billing",
            element: (
              <RoleRoute allowedRoles={["COMPANY", "ADMIN"]}>
                <BillingPage />
              </RoleRoute>
            ),
          },
          {
            path: "settings",
            element: <SettingsPage />,
          },
        ],
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
