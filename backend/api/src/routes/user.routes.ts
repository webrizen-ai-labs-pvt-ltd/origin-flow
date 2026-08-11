import { Router } from "express";
import {
  getMe,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  approveUser,
  deleteUser,
  getSessions,
  revokeSession,
} from "../controllers/user.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import {
  validateBody,
  validateQuery,
  validateParams,
} from "../middlewares/validate.middleware.js";
import {
  createUserSchema,
  updateUserSchema,
  getUsersQuerySchema,
  userIdParamSchema,
  sessionParamSchema,
} from "../schemas/user.schema.js";

export const userRouter: Router = Router();

// Current user profile
userRouter.get("/me", requireAuth, getMe);

// List users (ADMIN can list all with filters; COMPANY and MANAGER receive scoped team/subordinates)
userRouter.get(
  "/",
  requireAuth,
  requireRole(["ADMIN", "COMPANY", "MANAGER"]),
  validateQuery(getUsersQuerySchema),
  getUsers
);

// Admin-only direct user creation
userRouter.post(
  "/",
  requireAuth,
  requireRole(["ADMIN"]),
  validateBody(createUserSchema),
  createUser
);

// Specific user operations
userRouter.get("/:id", requireAuth, validateParams(userIdParamSchema), getUserById);
userRouter.put(
  "/:id",
  requireAuth,
  validateParams(userIdParamSchema),
  validateBody(updateUserSchema),
  updateUser
);
userRouter.delete(
  "/:id",
  requireAuth,
  requireRole(["ADMIN"]),
  validateParams(userIdParamSchema),
  deleteUser
);

// Admin approval
userRouter.patch(
  "/:id/approve",
  requireAuth,
  requireRole(["ADMIN"]),
  validateParams(userIdParamSchema),
  approveUser
);

// Sessions management
userRouter.get("/:id/sessions", requireAuth, validateParams(userIdParamSchema), getSessions);
userRouter.delete(
  "/:id/sessions/:sessionId",
  requireAuth,
  validateParams(sessionParamSchema),
  revokeSession
);
