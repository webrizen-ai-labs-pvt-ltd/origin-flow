import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.js";
import { prisma } from "../db.js";
import { Role } from "@prisma/client";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: Role;
    sessionId: string;
    phone?: string | null;
    companyId?: string | null;
    isVerified?: boolean;
  };
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies?.["session_token"] || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  // Validate session against DB and fetch live user data
  const session = await prisma.session.findUnique({
    where: { id: payload.sessionId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          companyId: true,
          isVerified: true,
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date() || !session.user) {
    return res.status(401).json({ error: "Session expired or invalid" });
  }

  req.user = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    sessionId: session.id,
    phone: session.user.phone,
    companyId: session.user.companyId,
    isVerified: session.user.isVerified,
  };

  next();
};

export const requireRole = (roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: Insufficient role permissions" });
    }

    next();
  };
};

export const requireAdmin = requireRole([Role.ADMIN]);
