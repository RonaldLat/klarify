/**
 * @fileoverview DEBUG ONLY - Check user purchases
 * DELETE THIS FILE IN PRODUCTION
 */
import { json } from "@sveltejs/kit";
import { prisma } from "$lib/server/prisma.js";

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals }) {
  if (!locals.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const purchases = await prisma.purchase.findMany({
    where: { userId: locals.user.id },
    include: { product: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: locals.user.id },
    include: { product: true },
  });

  return json({
    user: {
      id: locals.user.id,
      name: locals.user.name,
      email: locals.user.email,
    },
    purchases: purchases.map((p) => ({
      id: p.id,
      product: p.product.title,
      format: p.format,
      amount: p.amount,
      paymentStatus: p.paymentStatus,
      paystackRef: p.paystackRef,
      createdAt: p.createdAt,
    })),
    cartItems: cartItems.map((c) => ({
      id: c.id,
      product: c.product.title,
      format: c.format,
    })),
  });
}
