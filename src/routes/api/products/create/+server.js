/**
 * @fileoverview Create product endpoint (without file uploads)
 * Location: src/routes/api/products/create/+server.js
 */

import { json, error } from "@sveltejs/kit";
import { prisma } from "$lib/server/prisma.js";

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
  // Check admin auth
  if (!locals.user || locals.user.role !== "admin") {
    throw error(401, "Unauthorized");
  }

  try {
    const data = await request.json();

    // Validate required fields
    if (!data.title || !data.slug || !data.description || !data.author) {
      throw error(400, "Missing required fields");
    }

    // Check slug uniqueness
    const existingProduct = await prisma.product.findUnique({
      where: { slug: data.slug },
    });

    if (existingProduct) {
      throw error(400, "Product with this slug already exists");
    }

    // Create product in database
    const product = await prisma.product.create({
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        author: data.author,
        narrator: data.narrator || null,
        language: data.language || "en",
        type: data.type || "EBOOK",
        pdfPrice: data.pdfPrice || 50,
        audioPrice: data.audioPrice || 99,
        bundlePrice: data.bundlePrice || null,
        pageCount: data.pageCount || null,
        duration: data.duration || null,
        featured: data.featured || false,
        active: true,
        r2BasePath: "", // Will be set when files are uploaded
        coverImage: "", // Will be set when files are uploaded
        publishedAt: new Date(),
        ...(data.categoryIds?.length > 0 && {
          categories: {
            connect: data.categoryIds.map((id) => ({ id })),
          },
        }),
      },
    });

    // Update r2BasePath
    await prisma.product.update({
      where: { id: product.id },
      data: { r2BasePath: `products/${product.id}` },
    });

    console.log("✅ Product created:", product.id);

    return json({
      success: true,
      productId: product.id,
    });
  } catch (err) {
    console.error("❌ Create product error:", err);

    if (err.status) {
      throw err;
    }

    throw error(500, err.message || "Failed to create product");
  }
}
