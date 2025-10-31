/**
 * @fileoverview Root layout server load - provides user, session and cart count
 */

import { getCartCount } from "$lib/server/services/cart.js";

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ locals }) {
	const { user, session } = locals;
	
	// Get cart count if user is logged in
	let cartCount = 0;
	if (user) {
		try {
			cartCount = await getCartCount(user.id);
		} catch (error) {
			console.error("Failed to get cart count:", error);
		}
	}

	return {
		user,
		session,
		cartCount
	};
}
