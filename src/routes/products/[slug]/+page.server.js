/**
 * @fileoverview Product detail page - server load
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
			}
		}
	});

	if (!product) {
		throw error(404, "Product not found");
	}

	// Get related products (same categories)
	const relatedProducts = await prisma.product.findMany({
		where: {
			active: true,
			id: { not: product.id },
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
