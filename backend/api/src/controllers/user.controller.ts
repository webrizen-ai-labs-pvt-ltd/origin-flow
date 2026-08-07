import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { prisma } from "../db.js";

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: { companyProfile: true },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params["id"] as string;
    const user = await prisma.user.findUnique({
      where: { id },
      include: { companyProfile: true, company: true, subordinates: true, passkeys: true },
    });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const userResponse = {
      ...user,
      passkeys: user.passkeys ? user.passkeys.map((pk: any) => ({
        ...pk,
        counter: Number(pk.counter),
        credentialID: pk.credentialID.toString('base64url'),
        credentialPublicKey: undefined
      })) : []
    };

    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { email, name, role, companyId, companyProfile } = req.body;
    
    // Hierarchy checks
    if ((role === "MANAGER" || role === "CLIENT") && companyId) {
      const companyUser = await prisma.user.findUnique({ where: { id: companyId } });
      if (!companyUser || companyUser.role !== "COMPANY") {
        return res.status(400).json({ error: "Invalid companyId: must link to a user with COMPANY role" });
      }
    }

    if ((role === "MANAGER" || role === "CLIENT") && !companyId) {
       return res.status(400).json({ error: "Managers and Clients must be linked to a company" });
    }

    const userData: any = {
      email,
      name,
      role,
      companyId: (role === "MANAGER" || role === "CLIENT") ? companyId : null,
    };

    if (role === "COMPANY" && companyProfile) {
      userData.companyProfile = {
        create: companyProfile
      };
    }

    const user = await prisma.user.create({
      data: userData,
      include: { companyProfile: true }
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to create user" });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params["id"] as string;
    const { name, phone, avatarUrl, companyProfile } = req.body;

    const userToUpdate = await prisma.user.findUnique({ where: { id } });
    if (!userToUpdate) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Admins can update anyone, others can only update themselves
    if (req.user?.role !== "ADMIN" && req.user?.id !== id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const updateData: any = { name, phone, avatarUrl };

    if (userToUpdate.role === "COMPANY" && companyProfile) {
      updateData.companyProfile = {
        upsert: {
          create: companyProfile,
          update: companyProfile
        }
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { companyProfile: true }
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: "Failed to update user" });
  }
};

export const approveUser = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params["id"] as string;
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isVerified: true }
    });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: "Failed to approve user" });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params["id"] as string;
    await prisma.user.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
};

export const getSessions = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params["id"] as string;
    // Admins can see any sessions, users can see their own
    if (req.user?.role !== "ADMIN" && req.user?.id !== id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const sessions = await prisma.session.findMany({
      where: { userId: id, expiresAt: { gt: new Date() } }
    });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: "Failed to get sessions" });
  }
};

export const revokeSession = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params["id"] as string;
    const sessionId = req.params["sessionId"] as string;
    if (req.user?.role !== "ADMIN" && req.user?.id !== id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await prisma.session.deleteMany({
      where: { id: sessionId, userId: id }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to revoke session" });
  }
};
