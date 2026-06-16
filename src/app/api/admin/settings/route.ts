import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getAppTimezone, setAppTimezone } from "@/lib/appSettings";
import { isValidTimezone } from "@/lib/timezone";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const timezone = await getAppTimezone();
  return NextResponse.json({ timezone });
}

export async function PUT(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { timezone } = body as { timezone?: string };

  if (timezone === undefined) {
    return NextResponse.json({ error: "timezone is required" }, { status: 400 });
  }

  const trimmed = timezone.trim();
  const withoutColon = trimmed.startsWith(":") ? trimmed.slice(1) : trimmed;
  if (!withoutColon || !isValidTimezone(withoutColon)) {
    return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
  }

  const saved = await setAppTimezone(withoutColon);
  return NextResponse.json({ timezone: saved });
}
