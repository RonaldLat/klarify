/**
 * @fileoverview One-time cleanup script for stuck PENDING purchases
 * Run this ONCE in your database or create a temporary API endpoint
 */

// Option 1: Run directly in Prisma Studio or database console
// UPDATE "Purchase" 
// SET "paymentStatus" = 'COMPLETED' 
// WHERE "paymentStatus" = 'PENDING' 
// AND "paystackRef" LIKE 'mj9%'  -- Your test payment references
// AND "userId" = 'FKoHYgArRH6BZAQwLtVBwnub7y62jVfU';

// Option 2: Create a temporary API endpoint
// File: /routes/api/admin/cleanup-purchases/+server.js
import { json } from "@sveltejs/kit";
import { prisma } from "../src/lib/server/prisma.js";

/** @type {import('./$types').RequestHandler} */
export async function POST({ locals, request }) {
  // Check admin
  if (!locals.user || locals.user.role !== 'admin') {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { references } = body; // Array of Paystack references to verify

    if (!references || !Array.isArray(references)) {
      return json({ error: "References array required" }, { status: 400 });
    }

    // Update all matching PENDING purchases to COMPLETED
    const result = await prisma.purchase.updateMany({
      where: {
        paystackRef: { in: references },
        paymentStatus: "PENDING",
      },
      data: {
        paymentStatus: "COMPLETED",
      },
    });

    return json({
      success: true,
      updated: result.count,
      message: `Updated ${result.count} purchases to COMPLETED`,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return json({ error: error.message }, { status: 500 });
  }
}

// Usage: POST to /api/admin/cleanup-purchases
// Body: { "references": ["mj9ft0w99r", "abc123", ...] }
