/**
 * @fileoverview Shopping cart page - server load
 */

import { redirect } from "@sveltejs/kit";
import { getCart } from "$lib/server/services/cart.js";

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  // Require authentication
  if (!locals.user) {
    throw redirect(303, "/login");
  }

  const cart = await getCart(locals.user.id);

  return {
    cart,
  };
}
