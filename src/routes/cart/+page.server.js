/**
 * @fileoverview Shopping cart page - server load and actions
 */
import { redirect, fail } from "@sveltejs/kit"; // ⬅️ ADDED: fail import
import { getCart, removeFromCart, clearCart } from "$lib/server/services/cart.js"; // ⬅️ ADDED: removeFromCart, clearCart

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	// Require authentication
	if (!locals.user) {
		throw redirect(303, "/login");
	}

	const cart = await getCart(locals.user.id);

	return {
		cart,
		user: locals.user // ⬅️ ADDED: pass user data to frontend (optional, for display)
	};
}

// ⬅️ NEW: Actions for removing items and clearing cart
/** @type {import('./$types').Actions} */
export const actions = {
	/**
	 * Remove a single item from cart
	 */
	remove: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: "Unauthorized" });
		}

		try {
			const formData = await request.formData();
			const cartItemId = formData.get("cartItemId");

			if (!cartItemId) {
				return fail(400, { error: "Cart item ID required" });
			}

			const result = await removeFromCart(locals.user.id, cartItemId);

			if (!result.success) {
				return fail(400, { error: result.error });
			}

			return { success: true };
		} catch (error) {
			console.error("Remove from cart error:", error);
			return fail(500, { error: "Failed to remove item" });
		}
	},

	/**
	 * Clear entire cart
	 */
	clear: async ({ locals }) => {
		if (!locals.user) {
			return fail(401, { error: "Unauthorized" });
		}

		try {
			await clearCart(locals.user.id);
			return { success: true };
		} catch (error) {
			console.error("Clear cart error:", error);
			return fail(500, { error: "Failed to clear cart" });
		}
	}
};
