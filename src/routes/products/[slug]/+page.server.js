/**
 * @fileoverview Product detail page - server load (WITH SUMMARIES SUPPORT)
 * Location: /routes/products/[slug]/+page.server.js
 */
import { prisma } from "$lib/server/prisma.js";
import { error } from "@sveltejs/kit";

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
	const product = await prisma.product.findUnique({
		where: { 
			slug: params.slug,
			active: true
		},
		include: {
			categories: true,
			reviews: {
				include: {
					user: {
						select: {
							name: true,
							image: true
						}
					}
				},
				orderBy: {
					createdAt: "desc"
				},
				take: 10
			},
			// NEW: If this is a summary, include the original book
			originalProduct: {
				select: {
					id: true,
					title: true,
					slug: true,
					author: true,
					coverImage: true,
					type: true,
					pdfPrice: true,
					audioPrice: true,
					bundlePrice: true,
					duration: true,
					pageCount: true,
					description: true,
				}
			},
			// NEW: If this is a full book, include available summaries
			summaries: {
				where: { active: true },
				select: {
					id: true,
					title: true,
					slug: true,
					coverImage: true,
					duration: true,
					keyTakeaways: true,
					audioPrice: true,
					description: true,
					featured: true,
				}
			}
		}
	});

	if (!product) {
		throw error(404, "Product not found");
	}

	// Get related products (same categories, exclude summaries from related)
	const relatedProducts = await prisma.product.findMany({
		where: {
			active: true,
			id: { not: product.id },
			type: { not: 'SUMMARY' }, // Don't show summaries in related
			categories: {
				some: {
					id: {
						in: product.categories.map(c => c.id)
					}
				}
			}
		},
		take: 4,
		orderBy: {
			rating: "desc"
		}
	});

	return {
		product,
		relatedProducts
	};
}
