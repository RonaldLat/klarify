import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma.js';

export async function GET({ params, locals }) {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const purchase = await prisma.purchase.findUnique({
    where: { id: params.purchaseId },
    select: {
      id: true,
      downloadToken: true,
      userId: true,
      paymentStatus: true,
    }
  });

  if (!purchase) {
    return json({ error: 'Not found' }, { status: 404 });
  }

  if (purchase.userId !== locals.user.id) {
    return json({ error: 'Unauthorized' }, { status: 403 });
  }

  return json({
    purchaseId: purchase.id,
    downloadToken: purchase.downloadToken,
    paymentStatus: purchase.paymentStatus,
  });
}
