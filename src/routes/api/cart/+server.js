/**
 * @fileoverview Cart API endpoints
 */

import { json } from "@sveltejs/kit";
import { addToCart, removeFromCart } from "$lib/server/services/cart.js";

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
  // Check auth
  if (!locals.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { productId, format } = await request.json();

    if (!productId || !format) {
      return json(
        { error: "Product ID and format are required" },
        { status: 400 },
      );
    }

    const result = await addToCart(locals.user.id, productId, format);

    if (!result.success) {
      return json({ error: result.error }, { status: 400 });
    }

    return json({ success: true, cartItem: result.cartItem });
  } catch (error) {
    console.error("Add to cart error:", error);
    return json({ error: "Failed to add to cart" }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ request, locals }) {
  // Check auth
  if (!locals.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { cartItemId } = await request.json();

    if (!cartItemId) {
      return json({ error: "Cart item ID is required" }, { status: 400 });
    }

    const result = await removeFromCart(locals.user.id, cartItemId);

    if (!result.success) {
      return json({ error: result.error }, { status: 400 });
    }

    return json({ success: true });
  } catch (error) {
    console.error("Remove from cart error:", error);
    return json({ error: "Failed to remove from cart" }, { status: 500 });
  }
}
