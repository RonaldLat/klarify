/**
 * @fileoverview Server hooks - handles auth session with Better-Auth
 * Optimized to minimize database queries
 */

import { sequence } from "@sveltejs/kit/hooks";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { auth } from "$lib/server/auth.js";
import { prisma } from "$lib/server/prisma.js";
import { redirect } from "@sveltejs/kit";
import { building } from "$app/environment";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/settings",
  "/profile",
  "/admin",
  "/app",
  // "/cart",
  // "/checkout",
  "/orders",
  "/complete-profile",
  "/my-library",
  "/account",
];

const ADMIN_ROUTES = ["/admin"];

// API routes that need admin authentication
const ADMIN_API_ROUTES = [
  "/api/products",
  "/api/upload",
];

/**
 * Session handler - gets user session and fetches full user data only when needed
 */
const sessionHandle = async ({ event, resolve }) => {
  try {
    event.locals.auth = auth;

    // Get session from Better-Auth
    const sessionResult = await auth.api.getSession({
      headers: event.request.headers,
    });

    if (sessionResult?.user) {
      // Check if we need full user data (for admin routes, API routes, or specific protected routes)
      const needsFullUserData =
        ADMIN_ROUTES.some((route) => event.url.pathname.startsWith(route)) ||
        ADMIN_API_ROUTES.some((route) => event.url.pathname.startsWith(route)) ||
        event.url.pathname.startsWith("/account") ||
        event.url.pathname.startsWith("/complete-profile");

      if (needsFullUserData) {
        // Fetch full user data from database (including role)
        const fullUser = await prisma.user.findUnique({
          where: { id: sessionResult.user.id },
          select: {
            id: true,
            name: true,
            email: true,
            emailVerified: true,
            phone: true,
            image: true,
            role: true,
            banned: true,
            createdAt: true,
            updatedAt: true,
            reviews: true
          },
        });

        event.locals.user = fullUser;
      } else {
        // Use basic user data from session (no extra DB query)
        event.locals.user = {
          id: sessionResult.user.id,
          name: sessionResult.user.name,
          email: sessionResult.user.email,
          emailVerified: sessionResult.user.emailVerified,
          image: sessionResult.user.image,
          // Role is null here, will be fetched if needed
          role: null,
          phone: null,
          banned: null,
          createdAt: sessionResult.user.createdAt,
          updatedAt: sessionResult.user.updatedAt,
        };
      }

      event.locals.session = sessionResult.session;
    } else {
      event.locals.user = null;
      event.locals.session = null;
    }
  } catch (error) {
    console.error("Session fetch error:", error);
    event.locals.auth = auth;
    event.locals.user = null;
    event.locals.session = null;
  }

  return resolve(event);
};

/**
 * Auth guard - protects routes and checks admin access
 */
const authGuardHandle = async ({ event, resolve }) => {
  const { url, locals } = event;

  // Check if route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some((path) =>
    url.pathname.startsWith(path),
  );

  if (isProtectedRoute && !locals.user) {
    throw redirect(303, "/login");
  }

  // Check admin routes (both pages and API)
  const isAdminRoute = ADMIN_ROUTES.some((route) =>
    url.pathname.startsWith(route),
  );
  
  const isAdminApiRoute = ADMIN_API_ROUTES.some((route) =>
    url.pathname.startsWith(route),
  );

  if (isAdminRoute || isAdminApiRoute) {
    // If we don't have role yet (basic session), fetch it now
    if (locals.user && locals.user.role === null) {
      const fullUser = await prisma.user.findUnique({
        where: { id: locals.user.id },
        select: { role: true },
      });
      locals.user.role = fullUser?.role || null;
    }

    // Check if user is admin
    if (locals.user?.role !== "admin") {
      // For API routes, return 401 instead of redirect
      if (isAdminApiRoute) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }
      throw redirect(303, "/");
    }
  }

  // Redirect logged-in users away from auth pages
  if (
    (url.pathname === "/login" || url.pathname === "/signup") &&
    locals.user
  ) {
    throw redirect(303, "/");
  }

  return resolve(event);
};

/**
 * Cache control for protected routes
 */
const cacheControlHandle = async ({ event, resolve }) => {
  const isProtectedRoute = PROTECTED_ROUTES.some((path) =>
    event.url.pathname.startsWith(path),
  );

  const response = await resolve(event);

  if (isProtectedRoute) {
    response.headers.set(
      "Cache-Control",
      "no-store, max-age=0, must-revalidate",
    );
    response.headers.set("Pragma", "no-cache");
  }

  return response;
};

/**
 * Better-Auth handler - must be last in sequence
 */
const authHandler = ({ event, resolve }) => {
  return svelteKitHandler({ event, resolve, auth, building });
};

// Combine all handlers in sequence
export const handle = sequence(
  sessionHandle,
  authGuardHandle,
  cacheControlHandle,
  authHandler,
);
