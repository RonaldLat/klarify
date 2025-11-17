/**
 * @fileoverview Loads all available product categories with their summary counts.
 */
import { prisma } from "$lib/server/prisma.js";

/** @type {import('./$types').PageServerLoad} */
export async function load() {
    // Fetch all categories and include a count of related active summaries
    const categories = await prisma.category.findMany({
        orderBy: { name: "asc" },
        // Include products to count them server-side
        include: {
            products: {
                where: { type: "SUMMARY", active: true },
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
        description: cat.description,
        // Calculate the count of summaries
        summaryCount: cat.products.length,
    }));

    return {
        categories: enhancedCategories,
    };
}
