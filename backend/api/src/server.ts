import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { health_router } from "./routes/health.js";
import { authRouter } from "./routes/auth.routes.js";
import { userRouter } from "./routes/user.routes.js";

const app: Express = express();
const PORT = process.env["PORT"] ?? 4000;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/api/health", health_router);
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);

app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
});

export default app;
