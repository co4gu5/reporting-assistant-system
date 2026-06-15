import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const date = searchParams.get("date");

  const where: Record<string, unknown> = {};
  if (userId) where.userId = userId;
  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    where.date = { gte: start, lte: end };
  }

  const reports = await prisma.report.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      template: { select: { id: true, name: true, fields: true } },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(reports);
}
