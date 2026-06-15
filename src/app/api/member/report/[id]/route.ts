import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const existing = await prisma.report.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
    if (existing.userId !== payload.sub) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data } = await req.json();

    const updated = await prisma.report.update({
      where: { id },
      data: { data },
      include: {
        template: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update report error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
