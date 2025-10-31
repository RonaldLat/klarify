/**
 * @fileoverview Logout endpoint
 */

import { auth } from "$lib/server/auth.js";
import { redirect } from "@sveltejs/kit";

/** @type {import('./$types').RequestHandler} */
export async function GET({ request }) {
  // Sign out the user
  await auth.api.signOut({
    headers: request.headers,
  });

  // Redirect to login
  throw redirect(303, "/login");
}
