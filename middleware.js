// middleware.js
import { clerkMiddleware, createRouteMatcher, getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isCreatorRoute = createRouteMatcher(["/creator(.*)"]);

export default clerkMiddleware(async (auth, req) => {

  if (isAdminRoute(req)) {
    const { sessionClaims } = await auth();
    const roleClaim = sessionClaims?.metadata?.role;
    const isAdmin = !!roleClaim && String(roleClaim).toUpperCase() === "ADMIN";

    if (!isAdmin) {
      const url = new URL("/", req.url);
      return NextResponse.redirect(url);
    }
    return;
  }

  if (isCreatorRoute(req)) {
    const { userId } = await auth();

    if (!userId) {
      const signInUrl = new URL("/", req.url);
      return NextResponse.redirect(signInUrl);
    }
    return;
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)'
  ]
};
