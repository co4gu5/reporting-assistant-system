import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import {
  aggregateInterviewReports,
  getCurrentWeekDays,
} from "@/lib/interviewDashboard";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weekDates = getCurrentWeekDays();
  const rangeStart = new Date(weekDates[0]);
  rangeStart.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(weekDates[weekDates.length - 1]);
  rangeEnd.setHours(23, 59, 59, 999);

  const reports = await prisma.report.findMany({
    where: {
      date: {
        gte: rangeStart,
        lte: rangeEnd,
      },
    },
    include: {
      user: { select: { id: true, name: true } },
      template: { select: { fields: true } },
    },
    orderBy: { date: "asc" },
  });

  const dashboard = aggregateInterviewReports(
    reports.map((report) => ({
      date: report.date,
      data: report.data,
      userId: report.userId,
      userName: report.user.name,
      template: report.template,
    }))
  );

  return NextResponse.json(dashboard);
}
