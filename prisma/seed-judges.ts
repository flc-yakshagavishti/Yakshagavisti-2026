import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "../src/server/auth/password";

// Creates or updates judge1..judgeN with a username/password login at /judge-login.
// Usage: JUDGE_PASSWORD=... [JUDGE_COUNT=3] npx tsx prisma/seed-judges.ts

const password = process.env.JUDGE_PASSWORD;
const count = Number(process.env.JUDGE_COUNT ?? 3);

if (!password) {
  console.error("JUDGE_PASSWORD is required");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  for (let i = 1; i <= count; i++) {
    const username = `judge${i}`;
    // Placeholder email: User.email is required and unique.
    const email = `${username}@judges.local`;
    const hashed = await hashPassword(password!);

    const user = await prisma.user.upsert({
      where: { username },
      update: { role: Role.JUDGE, password: hashed },
      create: {
        username,
        email,
        name: `Judge ${i}`,
        role: Role.JUDGE,
        password: hashed,
      },
    });

    await prisma.judge.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    });

    console.log(`Judge ready: ${username} (role ${user.role})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
