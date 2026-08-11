import type { Request, Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { prisma } from "../db.js";
import { Role, BillingCycle, SubscriptionStatus, type Prisma } from "@prisma/client";
import { sendPlanAssignedEmail } from "../services/mailer.service.js";

export const getPlans = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const isAdmin = authReq.user?.role === Role.ADMIN;

    const where: Prisma.PlanWhereInput = isAdmin ? {} : { isActive: true };

    const plans = await prisma.plan.findMany({
      where,
      orderBy: [{ isPopular: "desc" }, { price: "asc" }],
      include: {
        _count: {
          select: {
            subscriptions: {
              where: { status: SubscriptionStatus.ACTIVE },
            },
          },
        },
      },
    });

    res.json(plans);
  } catch (error) {
    console.error("Error fetching plans:", error);
    res.status(500).json({ error: "Failed to fetch subscription plans" });
  }
};

export const getPlanById = async (req: Request, res: Response) => {
  try {
    const id = req.params["id"] as string;
    const plan = await prisma.plan.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subscriptions: {
              where: { status: SubscriptionStatus.ACTIVE },
            },
          },
        },
      },
    });

    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    res.json(plan);
  } catch (error) {
    console.error("Error fetching plan by ID:", error);
    res.status(500).json({ error: "Failed to fetch plan" });
  }
};

export const createPlan = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      slug,
      description,
      price,
      currency,
      billingCycle,
      features,
      limits,
      isActive,
      isPopular,
      trialDays,
    } = req.body;

    const existing = await prisma.plan.findUnique({ where: { slug } });
    if (existing) {
      return res.status(409).json({ error: "A plan with this slug already exists" });
    }

    const planData: Prisma.PlanCreateInput = {
      name,
      slug,
      description: description || undefined,
      price,
      currency: currency || "INR",
      billingCycle: (billingCycle as BillingCycle) || BillingCycle.MONTHLY,
      features: Array.isArray(features) ? features : [],
      limits: limits !== undefined ? limits : undefined,
      isActive: isActive ?? true,
      isPopular: isPopular ?? false,
      trialDays: trialDays ?? 0,
    };

    const plan = await prisma.plan.create({
      data: planData,
    });

    res.status(201).json(plan);
  } catch (error) {
    console.error("Error creating plan:", error);
    res.status(500).json({ error: "Failed to create plan" });
  }
};

export const updatePlan = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params["id"] as string;
    const {
      name,
      slug,
      description,
      price,
      currency,
      billingCycle,
      features,
      limits,
      isActive,
      isPopular,
      trialDays,
    } = req.body;

    if (slug) {
      const existing = await prisma.plan.findFirst({
        where: { slug, id: { not: id } },
      });
      if (existing) {
        return res.status(409).json({ error: "Another plan with this slug already exists" });
      }
    }

    const data: Prisma.PlanUpdateInput = {
      ...(name !== undefined ? { name } : {}),
      ...(slug !== undefined ? { slug } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(price !== undefined ? { price } : {}),
      ...(currency !== undefined ? { currency } : {}),
      ...(billingCycle !== undefined ? { billingCycle: billingCycle as BillingCycle } : {}),
      ...(features !== undefined ? { features } : {}),
      ...(limits !== undefined ? { limits: limits ?? undefined } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(isPopular !== undefined ? { isPopular } : {}),
      ...(trialDays !== undefined ? { trialDays } : {}),
    };

    const updatedPlan = await prisma.plan.update({
      where: { id },
      data,
    });

    res.json(updatedPlan);
  } catch (error) {
    console.error("Error updating plan:", error);
    res.status(500).json({ error: "Failed to update plan" });
  }
};

export const deletePlan = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params["id"] as string;

    const plan = await prisma.plan.findUnique({
      where: { id },
      include: {
        _count: {
          select: { subscriptions: true, transactions: true },
        },
      },
    });

    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    // If plan has past subscriptions/transactions, soft-deactivate to maintain audit trails
    if (plan._count.subscriptions > 0 || plan._count.transactions > 0) {
      const deactivated = await prisma.plan.update({
        where: { id },
        data: { isActive: false },
      });
      return res.json({
        message: "Plan has existing subscriber records and has been deactivated instead of permanently deleted",
        plan: deactivated,
      });
    }

    await prisma.plan.delete({ where: { id } });
    res.json({ message: "Plan deleted successfully" });
  } catch (error) {
    console.error("Error deleting plan:", error);
    res.status(500).json({ error: "Failed to delete plan" });
  }
};

export const assignPlan = async (req: AuthRequest, res: Response) => {
  try {
    const { companyId, planId, durationDays, notes } = req.body;

    const companyUser = await prisma.user.findUnique({
      where: { id: companyId },
      include: { companyProfile: true },
    });

    if (!companyUser) {
      return res.status(404).json({ error: "Company user not found" });
    }

    if (companyUser.role !== Role.COMPANY) {
      return res.status(400).json({ error: "Subscriptions can only be assigned to users with the COMPANY role" });
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    // Calculate duration in days based on cycle or explicit duration
    let days = durationDays;
    if (!days) {
      switch (plan.billingCycle) {
        case BillingCycle.MONTHLY:
          days = 30;
          break;
        case BillingCycle.QUARTERLY:
          days = 90;
          break;
        case BillingCycle.YEARLY:
          days = 365;
          break;
        case BillingCycle.LIFETIME:
          days = 3650;
          break;
        default:
          days = 30;
      }
    }

    const now = new Date();
    const currentPeriodEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    // Cancel existing active subscriptions for this company
    await prisma.subscription.updateMany({
      where: {
        companyId,
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
      },
      data: {
        status: SubscriptionStatus.CANCELED,
      },
    });

    // Create new active subscription
    const subscription = await prisma.subscription.create({
      data: {
        companyId,
        planId,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd,
        assignedByAdmin: true,
        notes: notes || "Assigned directly by administrator",
      },
      include: {
        plan: true,
        company: {
          select: {
            id: true,
            email: true,
            name: true,
            companyProfile: true,
          },
        },
      },
    });

    // Fire email notification asynchronously
    sendPlanAssignedEmail({
      to: companyUser.email,
      name: companyUser.name || companyUser.companyProfile?.companyName || "Organization Admin",
      planName: plan.name,
      billingCycle: plan.billingCycle,
      validUntil: currentPeriodEnd,
      notes,
    });

    res.status(201).json(subscription);
  } catch (error) {
    console.error("Error assigning plan:", error);
    res.status(500).json({ error: "Failed to assign plan" });
  }
};
