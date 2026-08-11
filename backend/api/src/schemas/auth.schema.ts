import { z } from "zod";
import { companyProfileSchema, roleEnum } from "./user.schema.js";

export const googleLoginSchema = z.object({
  idToken: z.string().min(1, "Google ID token is required"),
  role: roleEnum.optional(),
  companyId: z.string().uuid("Invalid company ID").optional().nullable(),
  companyProfile: companyProfileSchema.optional(),
});

export const passkeyAuthOptionsSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const passkeyAuthVerifySchema = z.object({
  email: z.string().email("Invalid email address"),
  credential: z.object({
    id: z.string().min(1, "Credential ID is required"),
    rawId: z.string().optional(),
    response: z.record(z.string(), z.any()),
    type: z.literal("public-key"),
    clientExtensionResults: z.record(z.string(), z.any()).optional(),
    authenticatorAttachment: z.string().optional(),
  }),
});
