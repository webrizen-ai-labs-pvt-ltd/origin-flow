import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/auth.store";
import { Layout } from "./components/layout";
import { DashboardLayout } from "./shared/dashboard-layout";
import { DashboardPage } from "./pages/dashboard";
import { Home } from "./pages/home";
import { SignIn } from "./pages/sign-in";
import { NotFoundPage } from "./pages/not-found";
import { ErrorBoundaryPage } from "./pages/error";
import { SettingsPage } from "./pages/settings";
import { UsersPage } from "./pages/users";
import { PlansPage } from "./pages/plans";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }

  return <>{children}</>;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorBoundaryPage />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "/sign-in",
        element: <SignIn />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    errorElement: <ErrorBoundaryPage />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "users",
        element: <UsersPage />,
      },
      {
        path: "plans",
        element: <PlansPage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
    ]
  }
]);

export function App() {
  return <RouterProvider router={router} />;
}
