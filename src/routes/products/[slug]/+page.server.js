// Update src/routes/products/[slug]/+page.server.js

import { error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma.js';

export async function load({ params, locals }) {
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

  // Check if user has favorited this product
  let isFavorite = false;
  if (locals.user) {
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId: locals.user.id,
          productId: product.id
        }
      }
    });
    isFavorite = !!favorite;
  }

  // Get related products
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
    relatedProducts,
    isFavorite,
    isAuthenticated: !!locals.user
  };
}
