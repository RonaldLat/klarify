/**
 * @fileoverview Checkout page - server load and payment processing
 */

import { redirect, fail } from "@sveltejs/kit";
import { getCart } from "$lib/server/services/cart.js";
import { prisma } from "$lib/server/prisma.js";
import { PAYSTACK_SECRET_KEY } from "$env/static/private";
import { PUBLIC_APP_URL } from "$env/static/public";

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	// Require authentication
	if (!locals.user) {
		throw redirect(303, "/login");
	}

	// Check if user has phone number
	if (!locals.user.phone) {
		throw redirect(303, "/complete-profile");
	}

	// Get cart
	const cart = await getCart(locals.user.id);

	// Redirect if cart is empty
	if (cart.items.length === 0) {
		throw redirect(303, "/cart");
	}

	return {
		cart,
		user: locals.user
	};
}

/** @type {import('./$types').Actions} */
export const actions = {
	/**
	 * Initialize Paystack payment
	 */
	initiate: async ({ request, locals }) {
		if (!locals.user) {
			return fail(401, { error: "Unauthorized" });
		}

		try {
			const formData = await request.formData();
			const cartItemIds = formData.getAll("cartItemIds");

			if (cartItemIds.length === 0) {
				return fail(400, { error: "No items to checkout" });
			}

			// Get cart items with products
			const cartItems = await prisma.cartItem.findMany({
				where: {
					id: { in: cartItemIds },
					userId: locals.user.id
				},
				include: {
					product: true
				}
			});

			if (cartItems.length === 0) {
				return fail(400, { error: "Cart items not found" });
			}

			// Calculate total
			const total = cartItems.reduce((sum, item) => {
				const price = 
					item.format === "BUNDLE" ? (item.product.bundlePrice || 0) :
					item.format === "AUDIO" ? item.product.audioPrice :
					item.product.pdfPrice;
				return sum + price;
			}, 0);

			// Create purchases in database (PENDING status)
			const purchases = await Promise.all(
				cartItems.map(item => 
					prisma.purchase.create({
						data: {
							userId: locals.user.id,
							productId: item.productId,
							format: item.format,
							amount: item.format === "BUNDLE" ? 
								(item.product.bundlePrice || 0) :
								item.format === "AUDIO" ? 
									item.product.audioPrice : 
									item.product.pdfPrice,
							currency: "KES",
							paystackRef: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
							paymentStatus: "PENDING",
							expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours
						}
					})
				)
			);

			// Initialize Paystack payment
			const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
				method: "POST",
				headers: {
					"Authorization": `Bearer ${PAYSTACK_SECRET_KEY}`,
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					email: locals.user.email,
					amount: Math.round(total * 100), // Convert to kobo (smallest unit)
					currency: "KES",
					callback_url: `${PUBLIC_APP_URL}/checkout/verify`,
					metadata: {
						purchase_ids: purchases.map(p => p.id),
						user_id: locals.user.id,
						cart_item_ids: cartItemIds
					}
				})
			});

			const paystackData = await paystackResponse.json();

			if (!paystackData.status) {
				console.error("Paystack error:", paystackData);
				return fail(500, { error: "Payment initialization failed" });
			}

			// Update purchases with actual Paystack reference
			await Promise.all(
				purchases.map(purchase =>
					prisma.purchase.update({
						where: { id: purchase.id },
						data: { paystackRef: paystackData.data.reference }
					})
				)
			);

			// Return authorization URL for redirect
			return {
				success: true,
				authorization_url: paystackData.data.authorization_url,
				reference: paystackData.data.reference
			};
		} catch (error) {
			console.error("Checkout error:", error);
			return fail(500, { error: "Checkout failed" });
		}
	}
};
