/**
 * Debug endpoint to test R2 access and purchase data
 * Location: src/routes/api/debug/purchase/[purchaseId]/+server.js
 * 
 * Usage: GET /api/debug/purchase/[purchaseId]
 * 
 * ⚠️ REMOVE THIS FILE IN PRODUCTION!
 */
import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma.js';
import { 
  getSummaryAudioUrl, 
  getAudioChapterUrls,
  getSecureDownloadUrl 
} from '$lib/server/services/r2.js';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { r2Client } from '$lib/server/services/r2.js';
import { R2_BUCKET_NAME } from '$env/static/private';

/** @type {import('./$types').RequestHandler} */
export async function GET({ params, locals }) {
  // Optional: Restrict to admins only
  // if (!locals.user || locals.user.role !== 'admin') {
  //   return json({ error: 'Unauthorized' }, { status: 401 });
  // }

  const { purchaseId } = params;

  try {
    console.log('🔍 Debug: Testing purchase:', purchaseId);

    // Get purchase data
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        product: {
          select: {
            id: true,
            slug: true,
            title: true,
            type: true,
            duration: true,
            keyTakeaways: true,
          }
        }
      }
    });

    if (!purchase) {
      return json({ error: 'Purchase not found' }, { status: 404 });
    }

    const productSlug = purchase.product.slug;
    const results = {
      purchase: {
        id: purchase.id,
        format: purchase.format,
        paymentStatus: purchase.paymentStatus,
        downloadCount: purchase.downloadCount,
        maxDownloads: purchase.maxDownloads,
        expired: new Date() > new Date(purchase.expiresAt),
      },
      product: {
        slug: productSlug,
        title: purchase.product.title,
        type: purchase.product.type,
      },
      r2Tests: {},
    };

    // Test 1: List all files for this product
    const prefix = purchase.product.type === 'SUMMARY' 
      ? `summaries/${productSlug}/` 
      : `products/${productSlug}/`;
    
    console.log('📂 Listing files with prefix:', prefix);
    
    const listCommand = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: prefix,
    });

    const listResult = await r2Client.send(listCommand);
    
    results.r2Tests.allFiles = {
      prefix,
      count: listResult.Contents?.length || 0,
      files: listResult.Contents?.map(obj => ({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
      })) || [],
    };

    // Test 2: Try to get audio URLs
    if (purchase.product.type === 'SUMMARY') {
      console.log('🎧 Testing summary audio URL');
      const summaryResult = await getSummaryAudioUrl(productSlug, 60);
      results.r2Tests.summaryAudio = {
        success: summaryResult.success,
        key: summaryResult.key,
        hasUrl: !!summaryResult.url,
        error: summaryResult.error,
      };
    } else {
      console.log('🎵 Testing audiobook chapters');
      const chaptersResult = await getAudioChapterUrls(productSlug, 60);
      results.r2Tests.audioChapters = {
        success: chaptersResult.success,
        chapterCount: chaptersResult.chapters?.length || 0,
        chapters: chaptersResult.chapters?.map(ch => ({
          number: ch.number,
          title: ch.title,
          filename: ch.filename,
          size: ch.size,
          hasUrl: !!ch.url,
        })) || [],
        error: chaptersResult.error,
      };
    }

    // Test 3: Try to get PDF URL if applicable
    if (purchase.format === 'PDF' || purchase.format === 'BUNDLE') {
      console.log('📄 Testing PDF URL');
      const pdfKey = `products/${productSlug}/${productSlug}.pdf`;
      const pdfResult = await getSecureDownloadUrl(pdfKey, 60);
      results.r2Tests.pdf = {
        key: pdfKey,
        success: pdfResult.success,
        hasUrl: !!pdfResult.url,
        error: pdfResult.error,
      };
    }

    // Test 4: Check environment
    results.environment = {
      bucketName: R2_BUCKET_NAME,
      hasR2Credentials: !!(process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY),
    };

    console.log('✅ Debug complete');

    return json({
      success: true,
      ...results,
    });

  } catch (err) {
    console.error('❌ Debug error:', err);
    return json({
      success: false,
      error: err.message,
      stack: err.stack,
    });
  }
}
