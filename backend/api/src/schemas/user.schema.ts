import { z } from "zod";

export const roleEnum = z.enum(["ADMIN", "COMPANY", "MANAGER", "CLIENT"]);

export const companyProfileSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format (e.g. ABCDE1234F)").optional().nullable(),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN format").optional().nullable(),
  address: z.string().optional().nullable(),
  udin: z.string().optional().nullable(),
  frn: z.string().optional().nullable(),
  auditCaps: z.string().optional().nullable(),
  din: z.string().optional().nullable(),
  tan: z.string().optional().nullable(),
});

export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  role: roleEnum.default("CLIENT"),
  companyId: z.string().uuid("Invalid company ID").optional().nullable(),
  companyProfile: companyProfileSchema.optional(),
}).refine((data) => {
  if ((data.role === "MANAGER" || data.role === "CLIENT") && !data.companyId) {
    return false;
  }
  return true;
}, {
  message: "Managers and Clients must be linked to a valid company (companyId)",
  path: ["companyId"],
});

export const updateUserSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").optional(),
  phone: z.string().optional().nullable(),
  avatarUrl: z.string().url("Invalid avatar URL").optional().nullable(),
  companyProfile: companyProfileSchema.partial().optional(),
});

export const getUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  role: roleEnum.optional(),
  isVerified: z.enum(["true", "false"]).transform((val) => val === "true").optional(),
  companyId: z.string().uuid().optional(),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid("Invalid user ID format"),
});

export const uuidParamSchema = userIdParamSchema;

export const sessionParamSchema = z.object({
  id: z.string().uuid("Invalid user ID format"),
  sessionId: z.string().uuid("Invalid session ID format"),
});
