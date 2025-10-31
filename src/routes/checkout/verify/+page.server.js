/**
 * @fileoverview Payment verification after Paystack redirect
 */
import { redirect } from "@sveltejs/kit";
import { prisma } from "$lib/server/prisma.js";
import { clearCart } from "$lib/server/services/cart.js";
import { verifyPayment } from "$lib/server/services/payment.js";

/** @type {import('./$types').PageServerLoad} */
export async function load({ url, locals }) {
  // Require authentication
  if (!locals.user) {
    throw redirect(303, "/login");
  }

  const reference = url.searchParams.get("reference");

  if (!reference) {
    throw redirect(303, "/checkout?error=no_reference");
  }

  try {
    // Verify payment with Paystack
    const paymentResult = await verifyPayment(reference);

    if (!paymentResult.success) {
      console.error("Payment verification failed:", paymentResult.error);
      throw redirect(303, "/checkout?error=payment_failed");
    }

    // Get metadata
    const metadata = paymentResult.data.metadata;
    const purchaseIds = metadata.purchase_ids;
    const cartItemIds = metadata.cart_item_ids;

    // Update purchases to COMPLETED
    await prisma.purchase.updateMany({
      where: {
        id: { in: purchaseIds },
        userId: locals.user.id,
      },
      data: {
        paymentStatus: "COMPLETED",
        paystackRef: reference,
      },
    });

    // Clear cart items
    if (cartItemIds && cartItemIds.length > 0) {
      await prisma.cartItem.deleteMany({
        where: {
          id: { in: cartItemIds },
          userId: locals.user.id,
        },
      });
    } else {
      // Fallback: clear entire cart
      await clearCart(locals.user.id);
    }

    // Get completed purchases with products
    const purchases = await prisma.purchase.findMany({
      where: {
        id: { in: purchaseIds },
      },
      include: {
        product: true,
      },
    });

    return {
      success: true,
      purchases,
      reference,
      amount: paymentResult.data.amount, // Already converted from kobo
    };
  } catch (error) {
    console.error("Verification error:", error);
    throw redirect(303, "/checkout?error=verification_failed");
  }
}
