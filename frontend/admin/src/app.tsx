import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Layout } from "./components/layout";
import { DashboardLayout } from "./shared/dashboard-layout";
import { DashboardPage } from "./pages/dashboard";
import { Home } from "./pages/home";
import { SignIn } from "./pages/sign-in";
import { NotFoundPage } from "./pages/not-found";
import { ErrorBoundaryPage } from "./pages/error";

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
    element: <DashboardLayout />,
    errorElement: <ErrorBoundaryPage />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
    ]
  }
]);

export function App() {
  return <RouterProvider router={router} />;
}
