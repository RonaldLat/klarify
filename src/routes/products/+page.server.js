// src/routes/products/+page.server.js

export async function load({ url }) {
  const searchQuery = url.searchParams.get("q") || "";
  const categorySlug = url.searchParams.get("category") || "";
  const type = url.searchParams.get("type") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const perPage = 12;

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
    // FIXED: type is now an array, use 'has' operator
    ...(type && {
      type: {
        has: type  // Check if array contains the type
      }
    }),
    ...(categorySlug && {
      categories: {
        some: {
          slug: categorySlug,
        },
      },
    }),
  };

  const [products, totalCount, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        categories: true,
      },
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
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
    products,
    categories,
    totalCount,
    currentPage: page,
    totalPages,
    searchQuery,
    categorySlug,
    type,
  };
}
