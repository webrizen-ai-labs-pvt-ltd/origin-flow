import express, { type Express } from "express";
import cors from "cors";
import { health_router } from "./routes/health.js";

const app: Express = express();
const PORT = process.env["PORT"] ?? 4000;

app.use(cors());
app.use(express.json());

app.use("/api/health", health_router);

app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
});

export default app;
