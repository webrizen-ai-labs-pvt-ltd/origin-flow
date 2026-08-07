import { Router } from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  approveUser,
  deleteUser,
  getSessions,
  revokeSession
} from "../controllers/user.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

export const userRouter: Router = Router();

// Only ADMIN can get all users or create users directly
userRouter.get("/", requireAuth, requireRole(["ADMIN"]), getUsers);
userRouter.post("/", requireAuth, requireRole(["ADMIN"]), createUser);

userRouter.get("/:id", requireAuth, getUserById);
userRouter.put("/:id", requireAuth, updateUser);
userRouter.delete("/:id", requireAuth, requireRole(["ADMIN"]), deleteUser);

// Admin approval
userRouter.patch("/:id/approve", requireAuth, requireRole(["ADMIN"]), approveUser);

// Sessions
userRouter.get("/:id/sessions", requireAuth, getSessions);
userRouter.delete("/:id/sessions/:sessionId", requireAuth, revokeSession);
