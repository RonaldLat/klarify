import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma.js';
import { WORKER_SECRET } from '$env/static/private';

export async function POST({ request }) {
  try {
    const workerSecret = request.headers.get('X-Worker-Secret');
    
    console.log('🔐 Verify request received');
    console.log('🔑 Expected secret:', WORKER_SECRET ? '***' + WORKER_SECRET.slice(-4) : 'NOT SET');
    console.log('🔑 Received secret:', workerSecret ? '***' + workerSecret.slice(-4) : 'NOT SET');
    
    if (!workerSecret || workerSecret !== WORKER_SECRET) {
      console.log('❌ Secret mismatch or missing');
      return json({ valid: false, error: 'Unauthorized' }, { status: 403 });
    }
    
    const { token } = await request.json();
    
    if (!token) {
      return json({ valid: false, error: 'Missing token' });
    }
    
    console.log('🔍 Looking up token:', token);
    
    const purchase = await prisma.purchase.findUnique({
      where: { downloadToken: token },
      select: {
        id: true,
        paymentStatus: true,
        expiresAt: true,
        downloadCount: true,
        maxDownloads: true,
      }
    });
    
    if (!purchase) {
      console.log('❌ Purchase not found');
      return json({ valid: false, error: 'Invalid token' });
    }
    
    const now = new Date();
    const expired = now > new Date(purchase.expiresAt);
    const limitReached = purchase.downloadCount >= purchase.maxDownloads;
    const paid = purchase.paymentStatus === 'COMPLETED';
    
    const valid = paid && !expired && !limitReached;
    
    console.log(`✅ Token validation result: ${valid}`);
    if (!valid) {
      console.log(`   Paid: ${paid}, Expired: ${expired}, Limit: ${limitReached}`);
    }
    
    return json({ valid });
    
  } catch (err) {
    console.error('❌ Verification error:', err);
    return json({ valid: false, error: 'Verification failed' });
  }
}
