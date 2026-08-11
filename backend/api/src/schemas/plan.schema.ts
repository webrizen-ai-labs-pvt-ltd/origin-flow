import { z } from "zod";

export const createPlanSchema = z.object({
  name: z.string().min(2, "Plan name must be at least 2 characters").max(100),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase alphanumeric characters and hyphens"),
  description: z.string().max(500).optional(),
  price: z.number().int().min(0, "Price in paise must be non-negative"),
  currency: z.string().default("INR"),
  billingCycle: z.enum(["MONTHLY", "QUARTERLY", "YEARLY", "LIFETIME"]).default("MONTHLY"),
  features: z.array(z.string()).default([]),
  limits: z
    .object({
      maxManagers: z.number().int().min(0).optional(),
      maxClients: z.number().int().min(0).optional(),
      storageGb: z.number().min(0).optional(),
      canUseAuditCompliance: z.boolean().optional(),
    })
    .optional(),
  isActive: z.boolean().default(true),
  isPopular: z.boolean().default(false),
  trialDays: z.number().int().min(0).default(0),
});

export const updatePlanSchema = createPlanSchema.partial();

export const assignPlanSchema = z.object({
  companyId: z.string().uuid("Invalid company ID"),
  planId: z.string().uuid("Invalid plan ID"),
  durationDays: z.number().int().min(1).max(3650).optional(),
  notes: z.string().max(500).optional(),
});

export const checkoutPlanSchema = z.object({
  planId: z.string().uuid("Invalid plan ID"),
  redirectUrl: z.string().url().optional(),
});
