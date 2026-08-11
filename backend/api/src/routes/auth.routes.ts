import { Router } from "express";
import {
  googleLogin,
  logout,
  generateRegOptions,
  verifyRegResponse,
  generateAuthOptions,
  verifyAuthResponse,
  revokePasskeys,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import {
  googleLoginSchema,
  passkeyAuthOptionsSchema,
  passkeyAuthVerifySchema,
} from "../schemas/auth.schema.js";

export const authRouter: Router = Router();

authRouter.post("/google", validateBody(googleLoginSchema), googleLogin);
authRouter.post("/logout", requireAuth, logout);
authRouter.post("/passkeys/register-options", requireAuth, generateRegOptions);
authRouter.post("/passkeys/register-verify", requireAuth, verifyRegResponse);
authRouter.delete("/passkeys", requireAuth, revokePasskeys);
authRouter.post("/passkeys/auth-options", validateBody(passkeyAuthOptionsSchema), generateAuthOptions);
authRouter.post("/passkeys/auth-verify", validateBody(passkeyAuthVerifySchema), verifyAuthResponse);
