import jwt from "jsonwebtoken";

const JWT_SECRET = process.env["JWT_SECRET"] || "super-secret-jwt-key-replace-me-later";

export const generateToken = (payload: { userId: string; sessionId: string; role: string }) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; sessionId: string; role: string };
  } catch (error) {
    return null;
  }
};
