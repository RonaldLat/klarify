/**
 * Download endpoint - generates secure download links
 * Location: src/routes/download/[purchaseId]/+server.js
 *
 * Now supports:
 * • Normal mode → returns JSON with signed URLs
 * • Force-download mode → streams a single chapter with Content-Disposition: attachment
 */

import { json, error } from "@sveltejs/kit";
import { prisma } from "$lib/server/prisma.js";
import {
  getSecureDownloadUrl,
  getAudioChapterUrls,
  getSummaryAudioUrl,
} from "$lib/server/services/r2.js";

/**
 * Helper: fetch a file from R2 and re-stream it as an attachment
 */
async function streamFileAsAttachment(r2Url, filename) {
  const response = await fetch(r2Url);

  if (!response.ok) {
    throw new Error(`Failed to fetch file from R2 (status ${response.status})`);
  }

  const headers = new Headers(response.headers);
  headers.set("Content-Disposition", `attachment; filename="${filename}"`);
  headers.set(
    "Content-Type",
    response.headers.get("content-type") || "audio/opus",
  );
  // Some CDNs/R2 add CSP headers that can break streaming – remove if present
  headers.delete("Content-Security-Policy");
  headers.delete("Content-Security-Policy-Report-Only");

  return new Response(response.body, {
    status: 200,
    headers,
  });
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ params, locals, url: requestUrl }) {
  // ------------------------------------------------------------------
  // Authentication
  // ------------------------------------------------------------------
  if (!locals.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const { purchaseId } = params;

  // ------------------------------------------------------------------
  // Force-download mode (for individual chapters)
  // ------------------------------------------------------------------
  const forceDownload = requestUrl.searchParams.get("forceDownload") === "true";
  const chapterParam = requestUrl.searchParams.get("chapter"); // string or null

  try {
    console.log("Generating download links for purchase:", purchaseId);

    // ------------------------------------------------------------------
    // Fetch purchase + basic validation (unchanged)
    // ------------------------------------------------------------------
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        product: {
          select: {
            id: true,
            slug: true,
            title: true,
            type: true,
          },
        },
      },
    });

    if (!purchase) {
      return json({ error: "Purchase not found" }, { status: 404 });
    }

    if (purchase.userId !== locals.user.id) {
      return json({ error: "Unauthorized" }, { status: 403 });
    }

    if (purchase.paymentStatus !== "COMPLETED") {
      return json({ error: "Payment not completed" }, { status: 400 });
    }

    const now = new Date();
    if (now > new Date(purchase.expiresAt)) {
      return json(
        { error: "Download period expired (48 hours)" },
        { status: 400 },
      );
    }

    if (purchase.downloadCount >= purchase.maxDownloads) {
      return json(
        {
          error: `Download limit reached (${purchase.maxDownloads} downloads)`,
        },
        { status: 400 },
      );
    }

    // ------------------------------------------------------------------
    // Normal mode: generate signed URLs
    // ------------------------------------------------------------------
    const urls = {};
    let chapters = null;

    // PDF
    if (purchase.format === "PDF" || purchase.format === "BUNDLE") {
      const pdfKey = `products/${purchase.product.slug}/${purchase.product.slug}.pdf`;
      const pdfResult = await getSecureDownloadUrl(pdfKey, 3600);
      if (pdfResult.success) {
        urls.pdf = pdfResult.url;
      }
    }

    // Audio / Summary
    if (purchase.format === "AUDIO" || purchase.format === "BUNDLE") {
      if (purchase.product.type === "SUMMARY") {
        const summaryResult = await getSummaryAudioUrl(
          purchase.product.slug,
          3600,
        );
        if (summaryResult.success) {
          urls.audio = summaryResult.url;
        } else {
          return json(
            { error: "Summary audio not available" },
            { status: 404 },
          );
        }
      } else {
        // Audiobook (multiple chapters)
        const chaptersResult = await getAudioChapterUrls(
          purchase.product.slug,
          3600,
        );

        if (!chaptersResult.success || !chaptersResult.chapters) {
          return json(
            { error: "Audio chapters not available" },
            { status: 404 },
          );
        }

        chapters = chaptersResult.chapters;

        // If only one chapter, also expose a direct URL (keeps old behaviour)
        if (chapters.length === 1) {
          urls.audio = chapters[0].url;
        }

        // --------------------------------------------------------------
        // FORCE DOWNLOAD MODE – this is the new magic
        // --------------------------------------------------------------
        if (forceDownload && chapterParam !== null) {
          const chapterNumber = parseInt(chapterParam, 10);
          const chapter = chapters.find((c) => c.number === chapterNumber);

          if (!chapter) {
            return json({ error: "Chapter not found" }, { status: 404 });
          }

          // Clean & safe filename
          const safeTitle = (chapter.title || "Chapter")
            .replace(/[^\w\- ]/g, "")
            .slice(0, 80);
          const filename = `${purchase.product.slug} - Chapter ${chapter.number} - ${safeTitle}.opus`;

          console.log(`Forcing download → ${filename}`);
          return await streamFileAsAttachment(chapter.url, filename);
        }
      }
    }

    // ------------------------------------------------------------------
    // Normal JSON response (list of URLs + chapters)
    // ------------------------------------------------------------------
    return json({
      success: true,
      urls,
      chapters, // only present for multi-chapter audiobooks
      purchase: {
        id: purchase.id,
        downloadToken: purchase.downloadToken,
        productSlug: purchase.product.slug,
        productType: purchase.product.type,
        format: purchase.format,
      },
    });
  } catch (err) {
    console.error("Download endpoint error:", err);
    return json(
      { error: err.message || "Failed to generate download links" },
      { status: 500 },
    );
  }
}
