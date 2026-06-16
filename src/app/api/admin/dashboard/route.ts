import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { getAppTimezone } from "@/lib/appSettings";
import { aggregateInterviewReports } from "@/lib/interviewDashboard";
import {
  getCurrentWeekDateStrings,
  getDayBoundsForDateStr,
} from "@/lib/timezone";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const timezone = await getAppTimezone();
  const weekDates = getCurrentWeekDateStrings(undefined, timezone);
  const [rangeStart] = getDayBoundsForDateStr(weekDates[0], timezone);
  const [, rangeEnd] = getDayBoundsForDateStr(
    weekDates[weekDates.length - 1],
    timezone
  );

  const reports = await prisma.report.findMany({
    where: {
      date: {
        gte: rangeStart,
        lt: rangeEnd,
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
    })),
    timezone
  );

  return NextResponse.json(dashboard);
}
