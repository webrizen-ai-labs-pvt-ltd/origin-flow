import { PrismaClient, BillingCycle } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.plan.count();
  if (count === 0) {
    console.log("Seeding default subscription plans...");
    await prisma.plan.createMany({
      data: [
        {
          name: "Starter Tier",
          slug: "starter-monthly",
          description: "Essential compliance & user hierarchy management for boutique firms.",
          price: 99900, // ₹999.00
          currency: "INR",
          billingCycle: BillingCycle.MONTHLY,
          features: [
            "Up to 2 Staff Managers",
            "Up to 25 Client accounts",
            "GST & PAN verification workflows",
            "Standard email support",
          ],
          limits: { maxManagers: 2, maxClients: 25, storageGb: 5, canUseAuditCompliance: true },
          isActive: true,
          isPopular: false,
        },
        {
          name: "Growth Professional",
          slug: "growth-monthly",
          description: "Advanced automation, team collaboration, and multi-client audits.",
          price: 299900, // ₹2,999.00
          currency: "INR",
          billingCycle: BillingCycle.MONTHLY,
          features: [
            "Up to 10 Staff Managers",
            "Up to 100 Client accounts",
            "Full corporate compliance suite (DIN, TAN, UDIN)",
            "Passkey biometric security",
            "Priority 24/7 support",
          ],
          limits: { maxManagers: 10, maxClients: 100, storageGb: 25, canUseAuditCompliance: true },
          isActive: true,
          isPopular: true,
        },
        {
          name: "Enterprise Corporate",
          slug: "enterprise-yearly",
          description: "Unlimited scaling, dedicated account manager, and custom compliance integrations.",
          price: 2499900, // ₹24,999.00
          currency: "INR",
          billingCycle: BillingCycle.YEARLY,
          features: [
            "Unlimited Staff Managers",
            "Unlimited Client accounts",
            "Dedicated infrastructure & audit logs",
            "Custom SLA & Phone support",
            "PhonePe AutoPay recurring renewal",
          ],
          limits: { maxManagers: 999, maxClients: 9999, storageGb: 100, canUseAuditCompliance: true },
          isActive: true,
          isPopular: false,
        },
      ],
    });
    console.log("✅ Seeded 3 default plans successfully.");
  } else {
    console.log(`Plans already exist in database (${count} plans found).`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
