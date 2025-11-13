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
    console.error("❌ No reference provided");
    throw redirect(303, "/cart");
  }

  console.log("🔍 Verifying payment for reference:", reference);

  try {
    // Verify payment with Paystack
    const paymentResult = await verifyPayment(reference);

    if (!paymentResult.success) {
      console.error("❌ Payment verification failed:", paymentResult.error);
      throw redirect(303, "/cart");
    }

    console.log("✅ Payment verified successfully");

    // Get metadata
    const metadata = paymentResult.data.metadata;
    const cartItemIds = metadata.cart_item_ids;

    console.log("📦 Cart items to clear:", cartItemIds);

    // Get purchases by reference
    const purchases = await prisma.purchase.findMany({
      where: {
        paystackRef: reference,
        userId: locals.user.id,
      },
      include: {
        product: true,
      },
    });

    console.log("📚 Found purchases:", purchases.length);

    if (purchases.length === 0) {
      console.error("❌ No purchases found for reference:", reference);
      throw redirect(303, "/cart");
    }

    const purchaseIds = purchases.map((p) => p.id);

    // Update purchases to COMPLETED
    const updateResult = await prisma.purchase.updateMany({
      where: {
        id: { in: purchaseIds },
        userId: locals.user.id,
      },
      data: {
        paymentStatus: "COMPLETED",
      },
    });

    console.log("✅ Updated purchases to COMPLETED:", updateResult.count);

    // Clear cart items
    if (cartItemIds && cartItemIds.length > 0) {
      await prisma.cartItem.deleteMany({
        where: {
          id: { in: cartItemIds },
          userId: locals.user.id,
        },
      });
      console.log("🗑️ Cleared cart items");
    } else {
      // Fallback: clear entire cart
      await clearCart(locals.user.id);
      console.log("🗑️ Cleared entire cart (fallback)");
    }

    // Refresh purchases to get updated data
    const completedPurchases = await prisma.purchase.findMany({
      where: {
        id: { in: purchaseIds },
      },
      include: {
        product: true,
      },
    });

    console.log(
      "✅ Verification complete! Purchases:",
      completedPurchases.length,
    );

    return {
      success: true,
      purchases: completedPurchases,
      reference,
      amount: paymentResult.data.amount,
    };
  } catch (error) {
    console.error("💥 Verification error:", error);

    // If it's not a redirect error, redirect to cart
    if (!error.status || error.status !== 303) {
      throw redirect(303, "/cart");
    }

    // Re-throw redirect errors
    throw error;
  }
}
