import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.role !== "ADMIN") return null;
  return payload;
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await prisma.reportTemplate.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, fields, setActive } = await req.json();

    if (!name || !fields) {
      return NextResponse.json({ error: "Name and fields are required" }, { status: 400 });
    }

    if (setActive) {
      await prisma.reportTemplate.updateMany({ data: { isActive: false } });
    }

    const template = await prisma.reportTemplate.create({
      data: { name, fields, isActive: !!setActive },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Create template error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
