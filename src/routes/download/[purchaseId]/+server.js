/**
 * Download endpoint - generates secure download links
 * Location: src/routes/download/[purchaseId]/+server.js
 * 
 * FIXED: Proper error handling and JSON responses
 */
import { json, error } from "@sveltejs/kit";
import { prisma } from "$lib/server/prisma.js";
import { 
  getSecureDownloadUrl,
  getAudioChapterUrls,
  getSummaryAudioUrl 
} from "$lib/server/services/r2.js";

/** @type {import('./$types').RequestHandler} */
export async function GET({ params, locals, request }) {
  // Check authentication
  if (!locals.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const { purchaseId } = params;

  try {
    console.log('📦 Generating download links for purchase:', purchaseId);

    // Get purchase with product details
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        product: {
          select: {
            id: true,
            slug: true,
            title: true,
            type: true,
          }
        },
      },
    });

    if (!purchase) {
      console.log('❌ Purchase not found');
      return json({ error: "Purchase not found" }, { status: 404 });
    }

    // Verify ownership
    if (purchase.userId !== locals.user.id) {
      console.log('❌ Unauthorized access attempt');
      return json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check payment status
    if (purchase.paymentStatus !== "COMPLETED") {
      console.log('❌ Payment not completed');
      return json({ error: "Payment not completed" }, { status: 400 });
    }

    // Check expiration
    const now = new Date();
    if (now > new Date(purchase.expiresAt)) {
      console.log('❌ Download period expired');
      return json({ error: "Download period expired (48 hours)" }, { status: 400 });
    }

    // Check download limit
    if (purchase.downloadCount >= purchase.maxDownloads) {
      console.log('❌ Download limit reached');
      return json({ 
        error: `Download limit reached (${purchase.maxDownloads} downloads)` 
      }, { status: 400 });
    }

    const urls = {};
    let chapters = null;

    // Generate PDF URL if needed
    if (purchase.format === "PDF" || purchase.format === "BUNDLE") {
      const pdfKey = `products/${purchase.product.slug}/${purchase.product.slug}.pdf`;
      console.log('📄 Generating PDF URL:', pdfKey);
      
      const pdfResult = await getSecureDownloadUrl(pdfKey, 3600);
      if (pdfResult.success) {
        urls.pdf = pdfResult.url;
        console.log('✅ PDF URL generated');
      } else {
        console.log('⚠️ PDF URL generation failed:', pdfResult.error);
      }
    }

    // Generate Audio URLs if needed
    if (purchase.format === "AUDIO" || purchase.format === "BUNDLE") {
      console.log('🎵 Product type:', purchase.product.type);

      // Handle SUMMARIES
      if (purchase.product.type === "SUMMARY") {
        console.log('🎧 Getting summary audio URL');
        const summaryResult = await getSummaryAudioUrl(purchase.product.slug, 3600);
        
        if (summaryResult.success) {
          urls.audio = summaryResult.url;
          console.log('✅ Summary audio URL generated');
        } else {
          console.log('❌ Summary audio not found:', summaryResult.error);
          return json({ 
            error: "Summary audio not available" 
          }, { status: 404 });
        }
      } 
      // Handle AUDIOBOOKS
      else {
        console.log('🎵 Getting audiobook chapters');
        const chaptersResult = await getAudioChapterUrls(purchase.product.slug, 3600);
        
        if (chaptersResult.success && chaptersResult.chapters) {
          chapters = chaptersResult.chapters;
          console.log(`✅ Generated ${chapters.length} chapter URLs`);
          
          // For single chapter, also provide direct download URL
          if (chapters.length === 1) {
            urls.audio = chapters[0].url;
          }
        } else {
          console.log('❌ No audio chapters found:', chaptersResult.error);
          return json({ 
            error: "Audio not available" 
          }, { status: 404 });
        }
      }
    }

    console.log('✅ Download links generated successfully');

    // Return the response
    return json({
      success: true,
      urls,
      chapters,
      purchase: {
        id: purchase.id,
        downloadToken: purchase.downloadToken,
        productSlug: purchase.product.slug,
        productType: purchase.product.type,
        format: purchase.format,
      },
    });

  } catch (err) {
    console.error('❌ Download link generation error:', err);
    
    // Return JSON error response
    return json({ 
      error: err.message || "Failed to generate download links" 
    }, { status: 500 });
  }
}
