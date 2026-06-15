import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const defaultFields = [
  {
    id: "field-1",
    type: "textarea",
    label: "What did you accomplish today?",
    required: true,
  },
  {
    id: "field-2",
    type: "textarea",
    label: "What are you planning to work on tomorrow?",
    required: true,
  },
  {
    id: "field-3",
    type: "textarea",
    label: "Any blockers or impediments?",
    required: false,
  },
  {
    id: "field-4",
    type: "number",
    label: "Hours worked today",
    required: true,
  },
  {
    id: "field-5",
    type: "select",
    label: "How was your day overall?",
    required: false,
    options: ["Excellent", "Good", "Neutral", "Difficult", "Rough"],
  },
];

async function main() {
  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!existingAdmin) {
    const hashed = await bcrypt.hash("admin123", 12);
    await prisma.user.create({
      data: {
        name: "Admin",
        email: "admin@example.com",
        password: hashed,
        role: "ADMIN",
      },
    });
    console.log("Created default admin: admin@example.com / admin123");
  }

  const existingTemplate = await prisma.reportTemplate.findFirst({
    where: { isActive: true },
  });

  if (!existingTemplate) {
    await prisma.reportTemplate.create({
      data: {
        name: "Default Daily Report",
        fields: defaultFields,
        isActive: true,
      },
    });
    console.log("Created default report template");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
