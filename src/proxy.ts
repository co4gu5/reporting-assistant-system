import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

const PUBLIC_PATHS = ["/", "/signin", "/signup"];
const ADMIN_PATHS = ["/admin"];
const MEMBER_PATHS = ["/member"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;
  const payload = token ? await verifyToken(token) : null;

  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (!payload) {
    if (isPublic) return NextResponse.next();
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  if (isPublic && pathname !== "/") {
    const dest = payload.role === "ADMIN" ? "/admin" : "/member";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  const isAdminPath = ADMIN_PATHS.some((p) => pathname.startsWith(p));
  const isMemberPath = MEMBER_PATHS.some((p) => pathname.startsWith(p));

  if (isAdminPath && payload.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/member", request.url));
  }

  if (isMemberPath && payload.role !== "MEMBER") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
