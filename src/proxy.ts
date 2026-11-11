import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/server/auth";

const neonMiddleware = auth.middleware({
  loginUrl: "/login",
});

function isPublicPath(pathname: string) {
  if (
    pathname === "/" ||
    pathname === "/menu" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/api/business"
  ) {
    return true;
  }
  if (
    pathname.startsWith("/menu/") ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/public/")
  ) {
    return true;
  }
  return false;
}

export default function proxy(req: NextRequest) {
  if (isPublicPath(req.nextUrl.pathname)) {
    return NextResponse.next();
  }
  return neonMiddleware(req);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
