// src/routes/api/record-download/+server.js
import { json, error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma.js';

const MAX_DOWNLOADS = 100;

export async function POST({ request, locals, getClientAddress }) {
  if (!locals.user) {
    throw error(401, 'Unauthorized');
  }

  try {
    const { purchaseId } = await request.json();
    
    if (!purchaseId) {
      throw error(400, 'Missing purchase ID');
    }

    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      select: {
        id: true,
        userId: true,
        downloadCount: true,
        paymentStatus: true,
        product: {
          select: {
            title: true,
            slug: true
          }
        }
      },
    });

    if (!purchase) {
      throw error(404, 'Purchase not found');
    }

    if (purchase.userId !== locals.user.id) {
      throw error(403, 'Unauthorized - Not your purchase');
    }

    if (purchase.paymentStatus !== 'COMPLETED') {
      throw error(400, 'Payment not completed');
    }

    // Check download limit
    if (purchase.downloadCount >= MAX_DOWNLOADS) {
      throw error(400, `Download limit reached (${MAX_DOWNLOADS} downloads)`);
    }

    const ipAddress = getClientAddress();
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    // Record download
    await prisma.download.create({
      data: {
        purchaseId: purchase.id,
        ipAddress,
        userAgent,
      },
    });

    // Increment count
    const updatedPurchase = await prisma.purchase.update({
      where: { id: purchase.id },
      data: {
        downloadCount: { increment: 1 },
      },
      select: {
        downloadCount: true,
      },
    });

    console.log(`✅ Download recorded: ${purchase.product.slug} (${updatedPurchase.downloadCount}/${MAX_DOWNLOADS})`);

    return json({
      success: true,
      downloadCount: updatedPurchase.downloadCount,
      downloadsRemaining: MAX_DOWNLOADS - updatedPurchase.downloadCount,
      maxDownloads: MAX_DOWNLOADS,
    });
  } catch (err) {
    console.error('❌ Record download error:', err);
    
    if (err.status) {
      throw err;
    }
    
    throw error(500, 'Failed to record download');
  }
}
