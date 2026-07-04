import { Router, type Router as RouterType } from "express";

export const health_router: RouterType = Router();

health_router.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "origin-flow-api",
    timestamp: new Date().toISOString(),
  });
});
