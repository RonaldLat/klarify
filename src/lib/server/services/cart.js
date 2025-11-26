// src/lib/server/services/cart.js

import { prisma } from "$lib/server/prisma.js";
import { calculatePrice } from "$lib/utils/pricing.js";

/**
 * Get actual price for cart item (handles free products and discounts)
 */
function getItemActualPrice(item) {
	const pricing = calculatePrice(item.product, item.format);
	return pricing.finalPrice; // This will be 0 for free products
}

/**
 * Get user's cart with items
 * UPDATED: Now calculates actual prices considering free/discounted products
 */
export async function getCart(userId) {
	const cartItems = await prisma.cartItem.findMany({
		where: { userId },
		include: {
			product: {
				include: {
					categories: true
				}
			}
		},
		orderBy: {
			addedAt: "desc"
		}
	});

	// Calculate totals using actual prices (including free products)
	const subtotal = cartItems.reduce((sum, item) => {
		const actualPrice = getItemActualPrice(item);
		return sum + actualPrice;
	}, 0);

	return {
		items: cartItems,
		itemCount: cartItems.length,
		subtotal,
		total: subtotal // Can add taxes/fees later
	};
}

/**
 * Add item to cart
 */
export async function addToCart(userId, productId, format) {
	// Check if item already exists
	const existing = await prisma.cartItem.findUnique({
		where: {
			userId_productId_format: {
				userId,
				productId,
				format
			}
		}
	});

	if (existing) {
		return { success: false, error: "Item already in cart" };
	}

	// Verify product exists and is active
	const product = await prisma.product.findUnique({
		where: { id: productId, active: true }
	});

	if (!product) {
		return { success: false, error: "Product not found" };
	}

	// Add to cart
	const cartItem = await prisma.cartItem.create({
		data: {
			userId,
			productId,
			format
		},
		include: {
			product: true
		}
	});

	return { success: true, cartItem };
}

/**
 * Remove item from cart
 */
export async function removeFromCart(userId, cartItemId) {
	try {
		await prisma.cartItem.delete({
			where: {
				id: cartItemId,
				userId // Ensure user owns this cart item
			}
		});

		return { success: true };
	} catch (error) {
		return { success: false, error: "Failed to remove item" };
	}
}

/**
 * Clear user's cart
 */
export async function clearCart(userId) {
	await prisma.cartItem.deleteMany({
		where: { userId }
	});
}

/**
 * Get cart item count for header
 */
export async function getCartCount(userId) {
	return await prisma.cartItem.count({
		where: { userId }
	});
}
