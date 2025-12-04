// src/routes/api/recent-purchases/+server.js
import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma.js';

export async function GET({ url }) {
  const limit = parseInt(url.searchParams.get('limit') || '10');
  
  try {
    const purchases = await prisma.purchase.findMany({
      where: {
        paymentStatus: 'COMPLETED',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      include: {
        product: { select: { title: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    
    return json({
      purchases: purchases.map(p => ({
        productTitle: p.product.title,
        location: 'Kenya',
        time: p.createdAt
      }))
    });
  } catch (error) {
    return json({ purchases: [] });
  }
}
