import { Router } from "express";
import { 
  googleLogin, 
  logout, 
  generateRegOptions,
  verifyRegResponse,
  generateAuthOptions,
  verifyAuthResponse,
  revokePasskeys
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

export const authRouter: Router = Router();

authRouter.post("/google", googleLogin);
authRouter.post("/logout", requireAuth, logout);
authRouter.post("/passkeys/register-options", requireAuth, generateRegOptions);
authRouter.post("/passkeys/register-verify", requireAuth, verifyRegResponse);
authRouter.delete("/passkeys", requireAuth, revokePasskeys);
authRouter.post("/passkeys/auth-options", generateAuthOptions);
authRouter.post("/passkeys/auth-verify", verifyAuthResponse);
