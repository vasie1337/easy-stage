import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isPublicRoute = createRouteMatcher(["/", "/sign-in", "/sign-up", "/about", "/stages"]);
const isProtectedRoute = createRouteMatcher(["/stages/:id"]);

export default convexAuthNextjsMiddleware(
  async (request, { convexAuth }) => {
    const isAuthenticated = await convexAuth.isAuthenticated();
    console.log(`[Auth] Path: ${request.nextUrl.pathname}, isAuthenticated: ${isAuthenticated}`);

    // Allow public routes without auth
    if (isPublicRoute(request)) {
      // If authenticated and on sign-in page, redirect to stages
      if (request.nextUrl.pathname === "/sign-in" && isAuthenticated) {
        console.log("[Auth] Redirecting authenticated user from /sign-in to /stages");
        return nextjsMiddlewareRedirect(request, "/stages");
      }
      return;
    }

    // Protect stage detail pages - redirect to sign-in if not authenticated
    if (isProtectedRoute(request) && !isAuthenticated) {
      console.log("[Auth] Redirecting unauthenticated user to /sign-in");
      return nextjsMiddlewareRedirect(request, `/sign-in?redirect=${request.nextUrl.pathname}`);
    }
  }
);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
