import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { normalizeTimezone } from "@/lib/timezone";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const setting = await prisma.notificationSetting.findUnique({
    where: { userId: payload.sub },
  });

  return NextResponse.json({ setting: setting ?? null });
}

export async function PUT(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { alarmTime, timezone, enabled, notificationEmail } = body as {
    alarmTime?: string;
    timezone?: string;
    enabled?: boolean;
    notificationEmail?: string | null;
  };

  const data: Record<string, unknown> = {};
  if (alarmTime          !== undefined) data.alarmTime          = alarmTime;
  if (timezone           !== undefined) data.timezone           = normalizeTimezone(timezone, "UTC");
  if (enabled            !== undefined) data.enabled            = enabled;
  if (notificationEmail  !== undefined) data.notificationEmail  = notificationEmail || null;

  const setting = await prisma.notificationSetting.upsert({
    where: { userId: payload.sub },
    update: data,
    create: {
      userId:            payload.sub,
      alarmTime:         alarmTime        ?? "09:00",
      timezone:          normalizeTimezone(timezone, "UTC"),
      enabled:           enabled          ?? true,
      notificationEmail: notificationEmail || null,
    },
  });

  return NextResponse.json({ setting });
}
