import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/", "/sign-in", "/sign-up", "/about", "/stages"]);
const isProtectedRoute = createRouteMatcher(["/stages/:id"]);

export default convexAuthNextjsMiddleware(
  async (request, { convexAuth }) => {
    // Debug logging for auth requests
    if (request.nextUrl.pathname === "/api/auth") {
      console.log("[Debug] Origin:", request.headers.get("Origin"));
      console.log("[Debug] Host:", request.headers.get("Host"));
      console.log("[Debug] X-Forwarded-Host:", request.headers.get("X-Forwarded-Host"));
      console.log("[Debug] URL:", request.url);
    }

    const isAuthenticated = await convexAuth.isAuthenticated();

    if (isPublicRoute(request)) {
      if (request.nextUrl.pathname === "/sign-in" && isAuthenticated) {
        return nextjsMiddlewareRedirect(request, "/stages");
      }
      return;
    }

    if (isProtectedRoute(request) && !isAuthenticated) {
      return nextjsMiddlewareRedirect(request, `/sign-in?redirect=${request.nextUrl.pathname}`);
    }
  },
  {
    verbose: true,
  }
);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
