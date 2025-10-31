/**
 * @fileoverview Load products for admin list view
 */

import { prisma } from "$lib/server/prisma.js";
import { deleteProductFiles } from "$lib/server/services/r2.js";
import { fail } from "@sveltejs/kit";

/** @type {import('./$types').PageServerLoad} */
export async function load() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      author: true,
      type: true,
      pdfPrice: true,
      audioPrice: true,
      featured: true,
      active: true,
      downloads: true,
      createdAt: true,
    },
  });

  return {
    products,
  };
}

/** @type {import('./$types').Actions} */
export const actions = {
  delete: async ({ request, locals }) => {
    // Check admin auth
    if (!locals.user || locals.user.role !== "admin") {
      return fail(401, { error: "Unauthorized" });
    }

    try {
      const formData = await request.formData();
      const productId = formData.get("productId")?.toString();

      if (!productId) {
        return fail(400, { error: "Product ID is required" });
      }

      // Get product to confirm it exists
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return fail(404, { error: "Product not found" });
      }

      // Delete files from R2
      await deleteProductFiles(productId);

      // Delete product from database (will cascade delete related records)
      await prisma.product.delete({
        where: { id: productId },
      });

      console.log("✅ Product deleted:", productId);

      return { success: true };
    } catch (error) {
      console.error("❌ Delete product error:", error);
      return fail(500, { error: "Failed to delete product" });
    }
  },
};
