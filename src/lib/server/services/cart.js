/**
 * @fileoverview Cart service - manages shopping cart operations
 */

import { prisma } from "$lib/server/prisma.js";

/**
 * Get user's cart with items
 * @param {string} userId
 * @returns {Promise<Object>}
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

	// Calculate totals
	const subtotal = cartItems.reduce((sum, item) => {
		const price = 
			item.format === "BUNDLE" ? (item.product.bundlePrice || 0) :
			item.format === "AUDIO" ? item.product.audioPrice :
			item.product.pdfPrice;
		return sum + price;
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
 * @param {string} userId
 * @param {string} productId
 * @param {string} format - "PDF" | "AUDIO" | "BUNDLE"
 * @returns {Promise<Object>}
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
 * @param {string} userId
 * @param {string} cartItemId
 * @returns {Promise<Object>}
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
 * @param {string} userId
 * @returns {Promise<void>}
 */
export async function clearCart(userId) {
	await prisma.cartItem.deleteMany({
		where: { userId }
	});
}

/**
 * Get cart item count for header
 * @param {string} userId
 * @returns {Promise<number>}
 */
export async function getCartCount(userId) {
	return await prisma.cartItem.count({
		where: { userId }
	});
}
