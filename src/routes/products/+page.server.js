// src/routes/products/+page.server.js
import { prisma } from "$lib/server/prisma.js";

/** @type {import('./$types').PageServerLoad} */
export async function load({ url, locals }) {
  const now = new Date();
  
  // Get query parameters
  const searchQuery = url.searchParams.get("q") || "";
  const categorySlug = url.searchParams.get("category");
  const typeFilter = url.searchParams.get("type");
  const sortBy = url.searchParams.get("sort") || "newest";
  const filterBy = url.searchParams.get("filter"); // NEW: Get filter parameter
  
  // Build where clause
  const where = {
    active: true,
    ...(searchQuery && {
      OR: [
        { title: { contains: searchQuery, mode: "insensitive" } },
        { author: { contains: searchQuery, mode: "insensitive" } },
        { description: { contains: searchQuery, mode: "insensitive" } },
      ],
    }),
    ...(categorySlug && {
      categories: {
        some: {
          slug: categorySlug,
        },
      },
    }),
    ...(typeFilter && {
      type: {
        has: typeFilter,
      },
    }),
  };
  
  // NEW: Add filter conditions
  if (filterBy === "free") {
    // Show only free products
    where.isFree = true;
    where.OR = [
      { freeUntil: null }, // Free forever
      { freeUntil: { gte: now } }, // Still free
    ];
  } else if (filterBy === "discounted") {
    // Show only discounted products
    where.isFree = false;
    where.OR = [
      {
        AND: [
          { discountPercent: { gt: 0 } },
          {
            OR: [
              { discountUntil: null },
              { discountUntil: { gte: now } },
            ],
          },
        ],
      },
      {
        AND: [
          { discountAmount: { gt: 0 } },
          {
            OR: [
              { discountUntil: null },
              { discountUntil: { gte: now } },
            ],
          },
        ],
      },
      {
        AND: [
          { limitedOffer: true },
          {
            OR: [
              { discountUntil: null },
              { discountUntil: { gte: now } },
            ],
          },
        ],
      },
    ];
  }
  
  // Build order by clause
  let orderBy = [];
  switch (sortBy) {
    case "popular":
      orderBy = [{ downloads: "desc" }, { rating: "desc" }];
      break;
    case "rating":
      orderBy = [{ rating: "desc" }, { reviewCount: "desc" }];
      break;
    case "price-low":
      orderBy = [{ pdfPrice: "asc" }];
      break;
    case "price-high":
      orderBy = [{ pdfPrice: "desc" }];
      break;
    case "newest":
    default:
      orderBy = [{ publishedAt: "desc" }, { createdAt: "desc" }];
  }
  
  // Get products
  const products = await prisma.product.findMany({
    where,
    include: {
      categories: true,
    },
    orderBy,
  });
  
  // Get categories for filter sidebar
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
    products,
    categories,
    searchQuery,
    categorySlug,
    typeFilter,
    sortBy,
    filterBy, // NEW: Return filter parameter
  };
}
