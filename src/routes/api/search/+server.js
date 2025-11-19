/**
 * @fileoverview Search API endpoint with autocomplete
 * Location: /routes/api/search/+server.js
 */

import { json } from "@sveltejs/kit";
import { prisma } from "$lib/server/prisma.js";

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  const query = url.searchParams.get("q") || "";
  const limit = parseInt(url.searchParams.get("limit") || "8");
  const type = url.searchParams.get("type") || "";

  // Return empty if query is too short
  if (query.length < 2) {
    return json({ results: [] });
  }

  try {
    // Build where clause
    const where = {
      active: true,
      ...(type && { type }),
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { author: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
    };

    // Search products
    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        author: true,
        coverImage: true,
        type: true,
        isSummary: true,
        pdfPrice: true,
        audioPrice: true,
        bundlePrice: true,
        rating: true,
        duration: true,
        pageCount: true,
      },
      orderBy: [{ featured: "desc" }, { rating: "desc" }],
      take: limit,
    });

    // Also search for popular authors (if no products found)
    let authors = [];
    if (products.length < limit) {
      authors = await prisma.product.findMany({
        where: {
          active: true,
          author: { contains: query, mode: "insensitive" },
        },
        select: {
          author: true,
        },
        distinct: ["author"],
        take: 3,
      });
    }

    return json({
      results: products,
      authors: authors.map((a) => a.author),
      query,
    });
  } catch (error) {
    console.error("Search error:", error);
    return json(
      { results: [], authors: [], error: "Search failed" },
      { status: 500 },
    );
  }
}
