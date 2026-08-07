import type { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { prisma } from "../db.js";
import { generateToken } from "../utils/jwt.js";
import { sendWelcomeEmail } from "../services/mailer.service.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const rpName = "Origin Flow";
const rpID = "localhost"; // Ideally dynamic based on env
const origin = process.env["WEBAUTHN_ORIGINS"]?.split(",") || ["http://localhost:3000"];

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { idToken, role, companyId, companyProfile } = req.body;
    
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ error: "Invalid Google Token" });
    }

    const { email, name, picture, sub: googleId } = payload;

    let user = await prisma.user.findUnique({ 
      where: { email },
      include: { companyProfile: true, passkeys: true } 
    });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      
      const assignedRole = (role === "COMPANY" || role === "MANAGER" || role === "CLIENT") ? role : "CLIENT";

      const userData: any = {
        email,
        name: name || "User",
        avatarUrl: picture,
        googleId,
        role: assignedRole,
      };

      if ((assignedRole === "MANAGER" || assignedRole === "CLIENT") && companyId) {
        userData.companyId = companyId;
      }

      if (assignedRole === "COMPANY" && companyProfile) {
        userData.companyProfile = {
          create: companyProfile
        };
      }

      user = await prisma.user.create({ 
        data: userData,
        include: { companyProfile: true, passkeys: true }
      });
      
      // Fire and forget welcome email
      sendWelcomeEmail(email, name || "User");
    } else {
      // Update Google ID if not set
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId },
          include: { companyProfile: true, passkeys: true }
        });
      }
    }

    // Create session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const sessionToken = crypto.randomUUID();

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        device: req.headers["user-agent"],
        token: sessionToken,
        expiresAt,
      }
    });

    const token = generateToken({ userId: user.id, sessionId: session.id, role: user.role });

    res.cookie("session_token", token, {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      expires: expiresAt
    });

    const userResponse = {
      ...user,
      passkeys: user.passkeys ? user.passkeys.map((pk: any) => ({
        ...pk,
        counter: Number(pk.counter),
        credentialID: pk.credentialID.toString('base64url'),
        credentialPublicKey: undefined
      })) : []
    };

    res.json({ user: userResponse, token });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.sessionId) {
      await prisma.session.delete({ where: { id: req.user.sessionId } });
    }
    res.clearCookie("session_token");
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Logout failed" });
  }
};

// WebAuthn Passkey Methods
export const generateRegOptions = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { passkeys: true }
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: new Uint8Array(Buffer.from(user.id)),
      userName: user.email,
      attestationType: "none",
      excludeCredentials: user.passkeys.map((pk: any) => ({
        id: Buffer.from(pk.credentialID).toString('base64url'),
        type: "public-key",
      })),
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { currentChallenge: options.challenge }
    });

    res.json(options);
  } catch (error) {
    console.error("Error generating passkey options:", error);
    res.status(500).json({ error: "Failed to generate passkey options" });
  }
};

export const verifyRegResponse = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user || !user.currentChallenge) {
      return res.status(400).json({ error: "Registration failed: Missing challenge" });
    }

    const verification = await verifyRegistrationResponse({
      response: req.body,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (verification.verified && verification.registrationInfo) {
      const { credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
      const { id: credentialID, publicKey: credentialPublicKey, counter } = verification.registrationInfo.credential;

      await prisma.passkey.create({
        data: {
          userId: user.id,
          credentialID: Buffer.from(credentialID, 'base64url'),
          credentialPublicKey: Buffer.from(credentialPublicKey),
          counter: BigInt(counter),
          credentialDeviceType,
          credentialBackedUp
        }
      });

      // Clear the challenge
      await prisma.user.update({
        where: { id: user.id },
        data: { currentChallenge: null }
      });

      return res.json({ verified: true });
    }

    res.status(400).json({ error: "Verification failed" });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to verify registration" });
  }
};

export const generateAuthOptions = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await prisma.user.findUnique({
      where: { email },
      include: { passkeys: true }
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: user.passkeys.map((pk) => ({
        id: Buffer.from(pk.credentialID).toString('base64url'),
        type: "public-key",
      })),
      userVerification: "preferred",
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { currentChallenge: options.challenge }
    });

    res.json(options);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate auth options" });
  }
};

export const verifyAuthResponse = async (req: Request, res: Response) => {
  try {
    const { email, credential } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { email },
      include: { passkeys: true }
    });

    if (!user || !user.currentChallenge) {
      return res.status(400).json({ error: "Authentication failed: Invalid state" });
    }

    const passkey = user.passkeys.find(
      (pk) => Buffer.from(pk.credentialID).toString('base64url') === credential.id || Buffer.from(pk.credentialID).toString('base64') === credential.id
    );

    if (!passkey) {
      return res.status(400).json({ error: "Passkey not found" });
    }

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: Buffer.from(passkey.credentialID).toString('base64url'),
        publicKey: new Uint8Array(passkey.credentialPublicKey),
        counter: Number(passkey.counter),
      },
    });

    if (verification.verified) {
      await prisma.passkey.update({
        where: { credentialID: passkey.credentialID },
        data: { counter: BigInt(verification.authenticationInfo.newCounter) }
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { currentChallenge: null }
      });

      // Create session
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const sessionToken = crypto.randomUUID();

      const session = await prisma.session.create({
        data: {
          userId: user.id,
          device: req.headers["user-agent"],
          token: sessionToken,
          expiresAt,
        }
      });

      const token = generateToken({ userId: user.id, sessionId: session.id, role: user.role });

      res.cookie("session_token", token, {
        httpOnly: true,
        secure: process.env["NODE_ENV"] === "production",
        expires: expiresAt
      });

      const userResponse = {
        ...user,
        passkeys: user.passkeys ? user.passkeys.map((pk: any) => ({
          ...pk,
          counter: Number(pk.counter),
          credentialID: pk.credentialID.toString('base64url'),
          credentialPublicKey: undefined
        })) : []
      };

      return res.json({ user: userResponse, token });
    }

    res.status(400).json({ error: "Authentication failed" });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to verify authentication" });
  }
};

export const revokePasskeys = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    await prisma.passkey.deleteMany({
      where: { userId }
    });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: "Failed to revoke passkeys" });
  }
};
