/**
 * @fileoverview Summaries listing page - load all active summaries
 */
import { prisma } from "$lib/server/prisma.js";

/** @type {import('./$types').PageServerLoad} */
export async function load({ url }) {
  const searchQuery = url.searchParams.get("q") || "";
  const categorySlug = url.searchParams.get("category") || "";
  const summaryType = url.searchParams.get("format") || "";
  const sortBy = url.searchParams.get("sort") || "newest";
  const page = parseInt(url.searchParams.get("page") || "1");
  const perPage = 12;

  // Build where clause for summaries only
  const where = {
    active: true,
    type: "SUMMARY", // Only get summaries
    ...(searchQuery && {
      OR: [
        { title: { contains: searchQuery, mode: "insensitive" } },
        { author: { contains: searchQuery, mode: "insensitive" } },
        { description: { contains: searchQuery, mode: "insensitive" } },
      ],
    }),
    ...(summaryType && { summaryType }),
    ...(categorySlug && {
      categories: {
        some: {
          slug: categorySlug,
        },
      },
    }),
  };

  // Build orderBy based on sort parameter
  let orderBy;
  switch (sortBy) {
    case "popular":
      orderBy = [{ downloads: "desc" }, { publishedAt: "desc" }];
      break;
    case "rating":
      orderBy = [{ rating: "desc" }, { reviewCount: "desc" }];
      break;
    case "newest":
    default:
      orderBy = [{ featured: "desc" }, { publishedAt: "desc" }];
  }

  // Get summaries with pagination
  const [summaries, totalCount, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        categories: true,
        originalProduct: {
          // Include the full book this is a summary of
          select: {
            id: true,
            title: true,
            slug: true,
            author: true,
            coverImage: true,
            type: true,
          },
        },
      },
      orderBy,
      take: perPage,
      skip: (page - 1) * perPage,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / perPage);

  return {
    summaries,
    categories,
    totalCount,
    currentPage: page,
    totalPages,
    searchQuery,
    categorySlug,
    summaryType,
    sortBy,
  };
}
