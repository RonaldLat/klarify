/**
 * @fileoverview Delete product endpoint (for rollback on failed uploads)
 * Location: src/routes/api/products/[id]/+server.js
 */

import { json, error } from "@sveltejs/kit";
import { prisma } from "$lib/server/prisma.js";
import { deleteProductFiles } from "$lib/server/services/r2.js";

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ params, locals }) {
  // Check admin auth
  if (!locals.user || locals.user.role !== "admin") {
    throw error(401, "Unauthorized");
  }

  try {
    const productId = params.id;

    if (!productId) {
      throw error(400, "Missing product ID");
    }

    // Delete files from R2
    await deleteProductFiles(productId);

    // Delete product from database
    await prisma.product.delete({
      where: { id: productId },
    });

    console.log("🗑️ Product deleted:", productId);

    return json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (err) {
    console.error("❌ Delete product error:", err);

    if (err.status) {
      throw err;
    }

    throw error(500, err.message || "Failed to delete product");
  }
}
