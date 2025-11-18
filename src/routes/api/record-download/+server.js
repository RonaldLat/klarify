import { json, error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma.js';

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
        maxDownloads: true,
        expiresAt: true,
        paymentStatus: true,
      },
    });

    if (!purchase) {
      throw error(404, 'Purchase not found');
    }

    if (purchase.userId !== locals.user.id) {
      throw error(403, 'Unauthorized');
    }

    const now = new Date();
    const expired = now > new Date(purchase.expiresAt);
    const limitReached = purchase.downloadCount >= purchase.maxDownloads;

    if (expired) {
      throw error(400, 'Download period expired');
    }

    if (limitReached) {
      throw error(400, 'Download limit reached');
    }

    if (purchase.paymentStatus !== 'COMPLETED') {
      throw error(400, 'Payment not completed');
    }

    const ipAddress = getClientAddress();
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    await prisma.download.create({
      data: {
        purchaseId: purchase.id,
        ipAddress,
        userAgent,
      },
    });

    const updatedPurchase = await prisma.purchase.update({
      where: { id: purchase.id },
      data: {
        downloadCount: { increment: 1 },
      },
      select: {
        downloadCount: true,
        maxDownloads: true,
      },
    });

    console.log(`✅ Recorded download for purchase ${purchaseId}`);

    return json({
      success: true,
      downloadCount: updatedPurchase.downloadCount,
      downloadsRemaining: updatedPurchase.maxDownloads - updatedPurchase.downloadCount,
    });

  } catch (err) {
    console.error('Record download error:', err);

    if (err.status) {
      throw err;
    }

    throw error(500, 'Failed to record download');
  }
}
