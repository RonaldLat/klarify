// src/routes/favorites/+page.server.js
import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma.js';

export async function load({ locals }) {
  if (!locals.user) {
    throw redirect(303, '/login');
  }

  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: locals.user.id },
      include: {
        product: {
          include: {
            categories: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      favorites: favorites.map(f => ({
        id: f.id,
        createdAt: f.createdAt,
        product: f.product
      }))
    };
  } catch (error) {
    console.error('Load favorites error:', error);
    return { favorites: [] };
  }
}
