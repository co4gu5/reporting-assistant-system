import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { getAppTimezone } from "@/lib/appSettings";
import { defaultTemplate } from "@/lib/defaultTemplate";
import { getDayBoundsUTC } from "@/lib/timezone";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "MEMBER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const timezone = await getAppTimezone();
  const [dayStart, dayEnd] = getDayBoundsUTC(new Date(), timezone);

  const report = await prisma.report.findFirst({
    where: {
      userId: payload.sub,
      date: { gte: dayStart, lt: dayEnd },
    },
    include: {
      template: true,
    },
  });

  if (report) {
    return NextResponse.json({ submitted: true, report });
  }

  const activeTemplate = await prisma.reportTemplate.findFirst({
    where: { isActive: true },
  });

  return NextResponse.json({
    submitted: false,
    template: activeTemplate ?? {
      id: "default",
      name: "Default Daily Report",
      fields: defaultTemplate,
      isActive: true,
    },
  });
}
