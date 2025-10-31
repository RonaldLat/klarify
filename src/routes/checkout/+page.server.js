/**
 * @fileoverview Checkout page - server load and payment processing
 */
import { redirect, fail } from "@sveltejs/kit";
import { getCart } from "$lib/server/services/cart.js";
import { initializePayment } from "$lib/server/services/payment.js";
import { prisma } from "$lib/server/prisma.js";

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  // Require authentication
  if (!locals.user) {
    throw redirect(303, "/login");
  }

  // Get cart
  const cart = await getCart(locals.user.id);

  // Redirect if cart is empty
  if (cart.items.length === 0) {
    throw redirect(303, "/cart");
  }

  return {
    cart,
    user: locals.user,
  };
}

/** @type {import('./$types').Actions} */
export const actions = {
  /**
   * Initialize Paystack payment
   */
  initiate: async ({ request, locals }) => {
    if (!locals.user) {
      return fail(401, { error: "Unauthorized" });
    }

    try {
      const formData = await request.formData();
      const cartItemIds = formData.getAll("cartItemIds");
      const phone = formData.get("phone"); // Get phone from form

      if (cartItemIds.length === 0) {
        return fail(400, { error: "No items to checkout" });
      }

      // Validate phone number
      const phoneRegex = /^254[17]\d{8}$/;
      if (!phone || !phoneRegex.test(phone)) {
        return fail(400, {
          error: "Valid phone number required (format: 254712345678)",
        });
      }

      // Update user's phone if different
      if (phone !== locals.user.phone) {
        await prisma.user.update({
          where: { id: locals.user.id },
          data: { phone },
        });
      }

      // Get cart items with products
      const cartItems = await prisma.cartItem.findMany({
        where: {
          id: { in: cartItemIds },
          userId: locals.user.id,
        },
        include: {
          product: true,
        },
      });

      if (cartItems.length === 0) {
        return fail(400, { error: "Cart items not found" });
      }

      // Calculate total
      const total = cartItems.reduce((sum, item) => {
        const price =
          item.format === "BUNDLE"
            ? item.product.bundlePrice || 0
            : item.format === "AUDIO"
              ? item.product.audioPrice
              : item.product.pdfPrice;
        return sum + price;
      }, 0);

      // Create purchases in database (PENDING status)
      const purchases = await Promise.all(
        cartItems.map((item) =>
          prisma.purchase.create({
            data: {
              userId: locals.user.id,
              productId: item.productId,
              format: item.format,
              amount:
                item.format === "BUNDLE"
                  ? item.product.bundlePrice || 0
                  : item.format === "AUDIO"
                    ? item.product.audioPrice
                    : item.product.pdfPrice,
              currency: "KES",
              paystackRef: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              paymentStatus: "PENDING",
              expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
            },
          }),
        ),
      );

      // Initialize payment with Paystack
      const paymentResult = await initializePayment({
        email: locals.user.email,
        amount: total,
        metadata: {
          purchase_ids: purchases.map((p) => p.id),
          user_id: locals.user.id,
          cart_item_ids: cartItemIds,
          customer_name: locals.user.name,
          customer_phone: phone,
        },
      });

      if (!paymentResult.success) {
        console.error("Payment initialization failed:", paymentResult.error);

        // Rollback: Delete pending purchases
        await prisma.purchase.deleteMany({
          where: {
            id: { in: purchases.map((p) => p.id) },
          },
        });

        return fail(500, {
          error: paymentResult.error || "Payment initialization failed",
        });
      }

      // Update purchases with actual Paystack reference
      await prisma.purchase.updateMany({
        where: {
          id: { in: purchases.map((p) => p.id) },
        },
        data: {
          paystackRef: paymentResult.data.reference,
        },
      });

      // Return authorization URL for redirect
      return {
        success: true,
        authorization_url: paymentResult.data.authorization_url,
        reference: paymentResult.data.reference,
      };
    } catch (error) {
      console.error("Checkout error:", error);
      return fail(500, { error: "Checkout failed" });
    }
  },
};
