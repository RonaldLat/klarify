import { sequence } from "@sveltejs/kit/hooks";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { auth } from "$lib/server/auth";
import { redirect } from "@sveltejs/kit";
import { building } from "$app/environment";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/settings",
  "/profile",
  "/admin",
  "/app",
  "/cart",
  "/checkout",
  "/orders",
  "/complete-profile",
  "/api/user/update-phone",
];

const sessionHandle = async ({ event, resolve }) => {
  try {
    // Attach auth instance so routes can use locals.auth.validate()
    event.locals.auth = auth;

    // Try to get current session
    const sessionResult = await auth.api.getSession({
      headers: event.request.headers,
    });

    event.locals.user = sessionResult?.user || null;
    event.locals.session = sessionResult?.session || null;
  } catch (error) {
    console.error("Session fetch error:", error);
    event.locals.auth = auth;
    event.locals.user = null;
    event.locals.session = null;
  }
  return resolve(event);
};

const authGuardHandle = async ({ event, resolve }) => {
  const { url, locals } = event;
  const isProtectedRoute = PROTECTED_ROUTES.some((path) =>
    url.pathname.startsWith(path),
  );

  if (isProtectedRoute && !locals.user) {
    throw redirect(303, "/login");
  }

  if (
    (url.pathname === "/login" || url.pathname === "/signup") &&
    locals.user
  ) {
    throw redirect(303, "/products");
  }

  return resolve(event);
};

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

const authHandler = ({ event, resolve }) => {
  return svelteKitHandler({ event, resolve, auth, building });
};

export const handle = sequence(
  sessionHandle,
  authGuardHandle,
  cacheControlHandle,
  authHandler,
);
