import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findFirst({ where: { role: "admin" } });
  if (existing) {
    console.log("Admin user already exists, skipping seed");
    return;
  }

  const passwordHash = await bcrypt.hash("admin123", 10);
  await prisma.user.create({
    data: {
      username: "admin",
      passwordHash,
      role: "admin",
    },
  });

  console.log("Seeded admin user (username: admin, password: admin123)");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
