// src/routes/api/favorites/+server.js
import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals }) {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
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

    return json({ 
      success: true, 
      favorites: favorites.map(f => f.product)
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    return json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { productId } = await request.json();

    if (!productId) {
      return json({ error: 'Product ID required' }, { status: 400 });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId: locals.user.id,
          productId: productId
        }
      }
    });

    if (existing) {
      return json({ 
        success: true, 
        message: 'Already in favorites',
        isFavorite: true
      });
    }

    // Add to favorites
    await prisma.favorite.create({
      data: {
        userId: locals.user.id,
        productId: productId
      }
    });

    return json({ 
      success: true, 
      message: 'Added to favorites',
      isFavorite: true
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    return json({ error: 'Failed to add favorite' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ request, locals }) {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { productId } = await request.json();

    if (!productId) {
      return json({ error: 'Product ID required' }, { status: 400 });
    }

    await prisma.favorite.delete({
      where: {
        userId_productId: {
          userId: locals.user.id,
          productId: productId
        }
      }
    });

    return json({ 
      success: true, 
      message: 'Removed from favorites',
      isFavorite: false
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    return json({ error: 'Failed to remove favorite' }, { status: 500 });
  }
}
