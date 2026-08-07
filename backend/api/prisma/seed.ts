import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    console.error("❌ Please provide an ADMIN_EMAIL environment variable.");
    console.error("Example: ADMIN_EMAIL=myemail@gmail.com pnpm run seed");
    process.exit(1);
  }

  console.log(`🌱 Seeding admin user with email: ${adminEmail}...`);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: Role.ADMIN,
      isVerified: true,
    },
    create: {
      email: adminEmail,
      name: "Super Admin",
      role: Role.ADMIN,
      isVerified: true,
    },
  });

  console.log("✅ Admin user seeded successfully:");
  console.log(admin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
