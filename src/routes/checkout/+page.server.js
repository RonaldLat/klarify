/**
 * @fileoverview Checkout page - handles free and paid products
 */
import { redirect, fail } from "@sveltejs/kit";
import { getCart } from "$lib/server/services/cart.js";
import { initializePayment } from "$lib/server/services/payment.js";
import { prisma } from "$lib/server/prisma.js";
import { PUBLIC_PAYSTACK_PUBLIC_KEY } from "$env/static/public";
import { calculatePrice } from "$lib/utils/pricing.js";

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, setHeaders }) {
  // Prevent caching
  setHeaders({
    'cache-control': 'no-store, no-cache, must-revalidate',
    'pragma': 'no-cache',
    'expires': '0'
  });

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
    paystackPublicKey: PUBLIC_PAYSTACK_PUBLIC_KEY,
  };
}

/** @type {import('./$types').Actions} */
export const actions = {
  /**
   * Initialize payment or process free checkout
   */
  initiate: async ({ request, locals }) => {
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
          userId: locals.user.id,
        },
        include: {
          product: true,
        },
      });

      if (cartItems.length === 0) {
        return fail(400, { error: "Cart items not found" });
      }

      // Calculate total using actual prices (considering free/discounts)
      const total = cartItems.reduce((sum, item) => {
        const pricing = calculatePrice(item.product, item.format);
        return sum + pricing.finalPrice;
      }, 0);

      // If total is 0 (all free products), skip payment and create purchases directly
      if (total === 0) {
        console.log('🎁 Free checkout - creating purchases without payment');

        const purchases = await prisma.$transaction(
          cartItems.map((item) => {
            const pricing = calculatePrice(item.product, item.format);
            return prisma.purchase.create({
              data: {
                userId: locals.user.id,
                productId: item.productId,
                format: item.format,
                amount: 0,
                currency: "KES",
                paystackRef: `FREE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                paymentStatus: "COMPLETED", // Mark as completed immediately
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year for free products
              },
            });
          })
        );

        // Delete cart items
        await prisma.cartItem.deleteMany({
          where: {
            id: { in: cartItemIds },
            userId: locals.user.id,
          },
        });

        // Redirect to library
        throw redirect(303, '/my-library?free=true');
      }

      // Initialize payment with Paystack
      const paymentResult = await initializePayment({
        email: locals.user.email,
        amount: total,
        metadata: {
          user_id: locals.user.id,
          cart_item_ids: cartItemIds,
          customer_name: locals.user.name,
        },
      });

      if (!paymentResult.success) {
        console.error("Payment initialization failed:", paymentResult.error);
        return fail(500, {
          error: paymentResult.error || "Payment initialization failed",
        });
      }

      // Create purchases with actual prices
      const purchases = await prisma.$transaction(
        cartItems.map((item) => {
          const pricing = calculatePrice(item.product, item.format);
          return prisma.purchase.create({
            data: {
              userId: locals.user.id,
              productId: item.productId,
              format: item.format,
              amount: pricing.finalPrice,
              currency: "KES",
              paystackRef: paymentResult.data.reference,
              paymentStatus: "PENDING",
              expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
            },
          });
        })
      );

      // Delete cart items after successful purchase creation
      await prisma.cartItem.deleteMany({
        where: {
          id: { in: cartItemIds },
          userId: locals.user.id,
        },
      });

      // Return payment data for Paystack Inline popup
      return {
        success: true,
        reference: paymentResult.data.reference,
        access_code: paymentResult.data.access_code,
        authorization_url: paymentResult.data.authorization_url,
        purchase_ids: purchases.map(p => p.id),
      };
    } catch (error) {
      console.error("Checkout error:", error);

      // Handle redirect (for free checkout)
      if (error?.status === 303) {
        throw error;
      }

      // Handle unique constraint error
      if (error.code === 'P2002' && error.meta?.target?.includes('paystackRef')) {
        return fail(500, {
          error: "Payment already processed. Please check your purchases."
        });
      }

      return fail(500, { error: "Checkout failed" });
    }
  },
};
