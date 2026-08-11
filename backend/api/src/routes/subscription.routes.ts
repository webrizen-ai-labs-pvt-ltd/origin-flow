import { Router } from "express";
import {
  initiateCheckout,
  handlePhonePeWebhook,
  verifyTransactionStatus,
  getMySubscription,
  getAllSubscriptions,
} from "../controllers/subscription.controller.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { checkoutPlanSchema } from "../schemas/plan.schema.js";

const router: Router = Router();

// PhonePe S2S Webhook callback (No auth, verified via X-VERIFY signature)
router.post("/phonepe/webhook", handlePhonePeWebhook);

// Company subscription endpoints
router.post("/checkout", requireAuth, validateBody(checkoutPlanSchema), initiateCheckout);
router.get("/verify/:merchantTransactionId", requireAuth, verifyTransactionStatus);
router.get("/me", requireAuth, getMySubscription);
router.get("/my-subscription", requireAuth, getMySubscription);

// Admin subscription directory & stats
router.get("/", requireAuth, requireAdmin, getAllSubscriptions);

export default router;
