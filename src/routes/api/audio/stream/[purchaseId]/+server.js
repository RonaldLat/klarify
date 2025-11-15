/**
 * @fileoverview Audio streaming API - get chapter list and signed URLs
 * Location: src/routes/api/audio/stream/[purchaseId]/+server.js
 */
import { json, error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma.js';
import { getAudioChapterUrls, getZippedAudioUrl } from '$lib/server/services/r2.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ params, locals }) {
  // Check authentication
  if (!locals.user) {
    throw error(401, 'Unauthorized');
  }

  const { purchaseId } = params;

  try {
    // Get purchase with product details
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: { 
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            author: true,
            duration: true,
            coverImage: true,
          }
        } 
      },
    });

    if (!purchase) {
      throw error(404, 'Purchase not found');
    }

    // Verify ownership
    if (purchase.userId !== locals.user.id) {
      throw error(403, 'Unauthorized');
    }

    // Check payment status
    if (purchase.paymentStatus !== 'COMPLETED') {
      throw error(400, 'Payment not completed');
    }

    // Check if format includes audio
    if (purchase.format !== 'AUDIO' && purchase.format !== 'BUNDLE') {
      throw error(400, 'This purchase does not include audio');
    }

    console.log('🎵 Loading audio for product:', purchase.product.slug);

    // Get chapter URLs
    const chapterUrls = await getAudioChapterUrls(
      purchase.product.slug,
      3600 // 1 hour expiry
    );

    // Get zipped audio URL
    const zipResult = await getZippedAudioUrl(
      purchase.product.slug,
      3600
    );

    // If no chapters found, return error
    if (!chapterUrls.success || !chapterUrls.chapters || chapterUrls.chapters.length === 0) {
      console.error('❌ No audio chapters available for:', purchase.product.slug);
      throw error(404, 'Audio chapters not available for this product');
    }

    return json({
      success: true,
      product: purchase.product,
      chapters: chapterUrls.chapters,
      zipUrl: zipResult.success ? zipResult.url : null,
      expiresIn: 3600, // seconds
    });
  } catch (err) {
    console.error('Audio streaming error:', err);
    
    if (err.status) {
      throw err;
    }
    
    throw error(500, err.message || 'Failed to load audio');
  }
}
