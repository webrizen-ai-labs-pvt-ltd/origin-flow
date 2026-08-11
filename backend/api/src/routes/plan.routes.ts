import { Router } from "express";
import {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  assignPlan,
} from "../controllers/plan.controller.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";
import { validateBody, validateParams } from "../middlewares/validate.middleware.js";
import {
  createPlanSchema,
  updatePlanSchema,
  assignPlanSchema,
} from "../schemas/plan.schema.js";
import { uuidParamSchema } from "../schemas/user.schema.js";

const router: Router = Router();

// Public / Authenticated plan listings
router.get("/", getPlans);
router.get("/:id", validateParams(uuidParamSchema), getPlanById);

// Admin-only management endpoints
router.post("/", requireAuth, requireAdmin, validateBody(createPlanSchema), createPlan);
router.put("/:id", requireAuth, requireAdmin, validateParams(uuidParamSchema), validateBody(updatePlanSchema), updatePlan);
router.delete("/:id", requireAuth, requireAdmin, validateParams(uuidParamSchema), deletePlan);
router.post("/assign", requireAuth, requireAdmin, validateBody(assignPlanSchema), assignPlan);

export default router;
