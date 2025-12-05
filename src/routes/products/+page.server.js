// src/routes/products/+page.server.js
import { prisma } from "$lib/server/prisma.js";

/** @type {import('./$types').PageServerLoad} */
export async function load({ url, locals }) {
    const now = new Date();

    // --- 1. Pagination Setup ---
    const pageSize = 12; // Define your page size (e.g., 12 products per page)
    const page = parseInt(url.searchParams.get("page") || "1");
    const offset = (page - 1) * pageSize; // Calculate offset

    // --- 2. Get Query Parameters ---
    const searchQuery = url.searchParams.get("q") || "";
    const categorySlug = url.searchParams.get("category");
    const typeFilter = url.searchParams.get("type");
    const sortBy = url.searchParams.get("sort") || "newest";
    const filterBy = url.searchParams.get("filter");

    // --- 3. Build WHERE Clause ---
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

    // --- 4. Add Filter Conditions (free / discounted) ---
    if (filterBy === "free") {
        where.isFree = true;
        // Merge the OR condition safely
        Object.assign(where, {
            OR: [
                { freeUntil: null },
                { freeUntil: { gte: now } },
            ],
        });
    } else if (filterBy === "discounted") {
        where.isFree = false;
        // This complex OR structure handles various discount conditions
        where.OR = [
            { // Discount by percentage
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
            { // Discount by amount
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
            { // Limited Offer
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

    // --- 5. Calculate Total Count and Pages ---
    const totalCount = await prisma.product.count({ where });
    const totalPages = Math.ceil(totalCount / pageSize);
    const currentPage = Math.min(Math.max(1, page), totalPages || 1);

    // --- 6. Build ORDER BY Clause ---
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

    // --- 7. Fetch Paginated Products ---
    const products = await prisma.product.findMany({
        where,
        include: {
            categories: true,
        },
        orderBy,
        take: pageSize, // Limit the number of results
        skip: offset, // Skip to the correct page
    });

    // --- 8. Fetch Categories (for filter sidebar) ---
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

    // --- 9. Return Data ---
    return {
        user: locals.user,
        products,
        categories,
        searchQuery,
        categorySlug,
        typeFilter,
        sortBy,
        filterBy,
        totalCount,
        currentPage,
        totalPages,
    };
}
