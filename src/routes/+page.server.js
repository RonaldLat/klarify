/**
 * @fileoverview Home page server load - get featured products
 */

import { prisma } from "$lib/server/prisma.js";

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  // Get featured products
  const featuredProducts = await prisma.product.findMany({
    where: {
      active: true,
      featured: true,
    },
    include: {
      categories: true,
    },
    orderBy: {
      publishedAt: "desc",
    },
    take: 8,
  });

  // Get categories with product counts
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: {
          products: {
            where: { active: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return {
    user: locals.user,
    featuredProducts,
    categories,
  };
}
