import { auth } from "@/server/auth";

export default auth.middleware({
  loginUrl: "/login",
  publicRoutes: [
    "/",
    "/menu",
    "/menu/*",
    "/login",
    "/signup",
    "/api/auth/*",
    "/api/public/*",
    "/api/business",
  ],
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
