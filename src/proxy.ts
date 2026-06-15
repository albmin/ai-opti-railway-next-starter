import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Next.js 16 proxy (replaces middleware.ts).
 *
 * Optimistic auth gate: redirects unauthenticated requests away from protected
 * routes based on the presence of the Better Auth session cookie. This does NOT
 * validate the session — the definitive check runs in the route's layout/handler
 * via `auth.api.getSession`.
 */
export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Only run on protected routes; everything else is handled at the page/handler level.
  matcher: ["/dashboard/:path*"],
};
