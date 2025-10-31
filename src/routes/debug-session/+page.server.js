/**
 * @fileoverview Debug page to check session state
 */

import { auth } from "$lib/server/auth.js";

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, request }) {
  // Get session directly from Better-Auth
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  return {
    localsUser: locals.user,
    localsSession: locals.session,
    betterAuthSession: session?.session,
    betterAuthUser: session?.user,
    cookies: request.headers.get("cookie"),
  };
}
