import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { prisma } from "../db.js";
import { Role, SubscriptionStatus, type Prisma } from "@prisma/client";
import { sendWelcomeEmail } from "../services/mailer.service.js";

// Helper to sanitize passkeys and serialize BigInt counters
const sanitizeUser = (user: any) => {
  if (!user) return user;
  const { currentChallenge, subscriptions, ...rest } = user;
  return {
    ...rest,
    activeSubscription: subscriptions?.[0] || null,
    passkeys: user.passkeys
      ? user.passkeys.map((pk: any) => ({
          id: pk.id,
          userId: pk.userId,
          credentialID: pk.credentialID ? Buffer.from(pk.credentialID).toString("base64url") : undefined,
          counter: Number(pk.counter ?? 0),
          credentialDeviceType: pk.credentialDeviceType,
          credentialBackedUp: pk.credentialBackedUp,
          transports: pk.transports,
          createdAt: pk.createdAt,
        }))
      : undefined,
  };
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        companyProfile: true,
        subscriptions: {
          where: { status: SubscriptionStatus.ACTIVE },
          include: { plan: true },
          take: 1,
        },
        company: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatarUrl: true,
            subscriptions: {
              where: { status: SubscriptionStatus.ACTIVE },
              include: { plan: true },
              take: 1,
            },
          },
        },
        subordinates: {
          select: { id: true, name: true, email: true, role: true, isVerified: true, avatarUrl: true },
        },
        passkeys: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(sanitizeUser(user));
  } catch (error) {
    console.error("Error fetching current user profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Role-based directory access check
    if (currentUser.role === Role.CLIENT) {
      return res.status(403).json({ error: "Forbidden: Clients do not have access to user directory listings" });
    }

    const page = Math.max(1, Number(req.query["page"]) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query["limit"]) || 10));
    const search = (req.query["search"] as string)?.trim();
    const roleFilter = req.query["role"] as Role | undefined;
    const isVerifiedFilter =
      req.query["isVerified"] !== undefined
        ? String(req.query["isVerified"]) === "true"
        : undefined;
    const companyIdParam = req.query["companyId"] as string | undefined;

    const where: Prisma.UserWhereInput = {};

    // Multi-tenant scoping
    if (currentUser.role === Role.COMPANY) {
      // Company can only see users linked to its company
      where.companyId = currentUser.id;
    } else if (currentUser.role === Role.MANAGER) {
      // Manager can only see users linked to the same company
      if (!currentUser.companyId) {
        return res.status(403).json({ error: "Manager is not associated with any company" });
      }
      where.companyId = currentUser.companyId;
    } else if (currentUser.role === Role.ADMIN) {
      // Admin can filter by companyId if provided
      if (companyIdParam) {
        where.companyId = companyIdParam;
      }
    }

    // Role filter
    if (roleFilter) {
      where.role = roleFilter;
    }

    // Verification status filter
    if (isVerifiedFilter !== undefined) {
      where.isVerified = isVerifiedFilter;
    }

    // Search by name or email
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          companyProfile: true,
          subscriptions: {
            where: { status: SubscriptionStatus.ACTIVE },
            include: { plan: true },
            take: 1,
          },
          company: {
            select: {
              id: true,
              name: true,
              email: true,
              subscriptions: {
                where: { status: SubscriptionStatus.ACTIVE },
                include: { plan: true },
                take: 1,
              },
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      data: users.map((u) => {
        const { currentChallenge, subscriptions, ...rest } = u;
        return {
          ...rest,
          activeSubscription: subscriptions?.[0] || null,
        };
      }),
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const targetId = req.params["id"] as string;
    const currentUser = req.user;

    if (!currentUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: targetId },
      include: {
        companyProfile: true,
        subscriptions: {
          where: { status: SubscriptionStatus.ACTIVE },
          include: { plan: true },
          take: 1,
        },
        company: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            subscriptions: {
              where: { status: SubscriptionStatus.ACTIVE },
              include: { plan: true },
              take: 1,
            },
          },
        },
        subordinates: {
          select: { id: true, name: true, email: true, role: true, isVerified: true },
        },
        passkeys: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // IDOR Protection: Strict permission check
    const isSelf = currentUser.id === targetId;
    const isAdmin = currentUser.role === Role.ADMIN;
    const isParentCompany = currentUser.role === Role.COMPANY && user.companyId === currentUser.id;
    const isSameCompanyManager =
      currentUser.role === Role.MANAGER &&
      currentUser.companyId &&
      user.companyId === currentUser.companyId;

    if (!isSelf && !isAdmin && !isParentCompany && !isSameCompanyManager) {
      return res.status(403).json({ error: "Forbidden: You do not have permission to view this profile" });
    }

    res.json(sanitizeUser(user));
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { email, name, role, companyId, companyProfile } = req.body;

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "A user with this email already exists" });
    }

    // Hierarchy validation: Manager & Client must be linked to a COMPANY user
    if ((role === Role.MANAGER || role === Role.CLIENT) && companyId) {
      const companyUser = await prisma.user.findUnique({ where: { id: companyId } });
      if (!companyUser || companyUser.role !== Role.COMPANY) {
        return res.status(400).json({ error: "Invalid companyId: must link to an existing user with COMPANY role" });
      }
    }

    if ((role === Role.MANAGER || role === Role.CLIENT) && !companyId) {
      return res.status(400).json({ error: "Managers and Clients must be linked to a company" });
    }

    const userData: Prisma.UserCreateInput = {
      email,
      name,
      role,
      ...(companyId && (role === Role.MANAGER || role === Role.CLIENT)
        ? { company: { connect: { id: companyId } } }
        : {}),
      ...(role === Role.COMPANY && companyProfile
        ? {
            companyProfile: {
              create: companyProfile,
            },
          }
        : {}),
    };

    const user = await prisma.user.create({
      data: userData,
      include: { companyProfile: true },
    });

    // Fire welcome email asynchronously
    sendWelcomeEmail(email, name || "User");

    const { currentChallenge, ...sanitized } = user;
    res.status(201).json(sanitized);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params["id"] as string;
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userToUpdate = await prisma.user.findUnique({ where: { id } });
    if (!userToUpdate) {
      return res.status(404).json({ error: "User not found" });
    }

    // Admins can update any user; others can only update themselves
    if (currentUser.role !== Role.ADMIN && currentUser.id !== id) {
      return res.status(403).json({ error: "Forbidden: You cannot update another user's profile" });
    }

    const { name, phone, avatarUrl, companyProfile } = req.body;

    const updateData: Prisma.UserUpdateInput = {
      ...(name !== undefined ? { name } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
    };

    // If company user or admin updating company profile
    if ((userToUpdate.role === Role.COMPANY || currentUser.role === Role.ADMIN) && companyProfile) {
      updateData.companyProfile = {
        upsert: {
          create: companyProfile,
          update: companyProfile,
        },
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { companyProfile: true },
    });

    const { currentChallenge, ...sanitized } = updatedUser;
    res.json(sanitized);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
};

export const approveUser = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params["id"] as string;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isVerified: true },
      include: { companyProfile: true },
    });

    const { currentChallenge, ...sanitized } = updatedUser;
    res.json(sanitized);
  } catch (error) {
    console.error("Error approving user:", error);
    res.status(500).json({ error: "Failed to approve user" });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params["id"] as string;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await prisma.user.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

export const getSessions = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params["id"] as string;
    const currentUser = req.user;

    if (!currentUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Admins can see any sessions, users can see their own
    if (currentUser.role !== Role.ADMIN && currentUser.id !== id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const sessions = await prisma.session.findMany({
      where: { userId: id, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    res.json(sessions);
  } catch (error) {
    console.error("Error getting sessions:", error);
    res.status(500).json({ error: "Failed to get sessions" });
  }
};

export const revokeSession = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params["id"] as string;
    const sessionId = req.params["sessionId"] as string;
    const currentUser = req.user;

    if (!currentUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (currentUser.role !== Role.ADMIN && currentUser.id !== id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await prisma.session.deleteMany({
      where: { id: sessionId, userId: id },
    });

    res.status(204).send();
  } catch (error) {
    console.error("Error revoking session:", error);
    res.status(500).json({ error: "Failed to revoke session" });
  }
};
