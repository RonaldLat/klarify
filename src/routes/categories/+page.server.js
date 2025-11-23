// src/routes/categories/+page.server.js

/**
 * @fileoverview Loads all available product categories with their summary counts.
 */
import { prisma } from "$lib/server/prisma.js";

/** @type {import('./$types').PageServerLoad} */
export async function load() {
  // Fetch all categories and include a count of related active summaries
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      products: {
        where: {
          type: { has: "SUMMARY" },  // FIXED: Use 'has' for array
          active: true
        },
        select: { id: true }
      }
    }
  });

  // Map the results to clean up and attach the count
  const enhancedCategories = categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    icon: cat.icon,
    summaryCount: cat.products.length,
  }));

  return {
    categories: enhancedCategories,
  };
}
