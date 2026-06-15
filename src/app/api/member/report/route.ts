import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { defaultTemplate } from "@/lib/defaultTemplate";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "MEMBER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { templateId, data } = await req.json();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await prisma.report.findFirst({
      where: {
        userId: payload.sub,
        date: { gte: today, lt: tomorrow },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You have already submitted a report today" },
        { status: 409 }
      );
    }

    let resolvedTemplateId = templateId;

    if (!resolvedTemplateId) {
      const active = await prisma.reportTemplate.findFirst({
        where: { isActive: true },
      });
      if (active) {
        resolvedTemplateId = active.id;
      } else {
        const fallback = await prisma.reportTemplate.create({
          data: {
            name: "Default Daily Report",
            fields: defaultTemplate as unknown as import("@prisma/client/runtime/client").InputJsonValue,
            isActive: true,
          },
        });
        resolvedTemplateId = fallback.id;
      }
    }

    const report = await prisma.report.create({
      data: {
        userId: payload.sub,
        templateId: resolvedTemplateId,
        data,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Submit report error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
