import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { health_router } from "./routes/health.js";
import { authRouter } from "./routes/auth.routes.js";
import { userRouter } from "./routes/user.routes.js";
import planRouter from "./routes/plan.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";

const app: Express = express();
const PORT = process.env["PORT"] ?? 4000;

const defaultOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
];

const envOrigins = (process.env["CORS_ORIGINS"] || process.env["WEBAUTHN_ORIGINS"])
  ?.split(",")
  .map((o) => o.trim())
  .filter(Boolean) || [];

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || process.env["NODE_ENV"] !== "production") {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-VERIFY", "X-MERCHANT-ID"],
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/health", health_router);
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/plans", planRouter);
app.use("/api/subscriptions", subscriptionRouter);

app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
});

export default app;
