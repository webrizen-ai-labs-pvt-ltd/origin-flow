import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@origin-flow/ui";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "@/index.css";
import { App } from "@/app";

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "placeholder-client-id";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <ThemeProvider defaultTheme="system">
        <App />
      </ThemeProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
);
