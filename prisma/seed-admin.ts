import { PrismaClient, Role } from "@prisma/client";

// Creates or promotes a single admin user.
// Login is through the existing auth provider, so no password is stored here.
// Usage: ADMIN_EMAIL=you@example.com ADMIN_NAME="Your Name" npx tsx prisma/seed-admin.ts

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
const name = process.env.ADMIN_NAME?.trim() || "Admin";

if (!email) {
  console.error("ADMIN_EMAIL is required");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: Role.ADMIN },
    create: { email, name, role: Role.ADMIN, emailVerified: true },
  });

  console.log(`Admin ready: ${admin.email} (role ${admin.role})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
