/**
 * @fileoverview Download service - handles secure file downloads
 * UPDATED: 100 download limit to prevent abuse
 */
import { prisma } from "$lib/server/prisma.js";
import { getPurchaseDownloadUrls } from "$lib/server/services/r2.js";

const MAX_DOWNLOADS = 100; // Prevent abuse while being generous

/**
 * Generate secure download links for a purchase
 * UPDATED: No download count limit, only authentication required
 */
export async function generateDownloadLinks(
  purchaseId,
  userId,
  ipAddress,
  userAgent,
) {
  try {
    // Get purchase with product details
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: { product: true },
    });

    if (!purchase) {
      return { success: false, error: "Purchase not found" };
    }

    // Verify ownership
    if (purchase.userId !== userId) {
      return { success: false, error: "Unauthorized - This is not your purchase" };
    }

    // Check payment status
    if (purchase.paymentStatus !== "COMPLETED") {
      return { success: false, error: "Payment not completed" };
    }

    // Check download limit (100 downloads)
    if (purchase.downloadCount >= MAX_DOWNLOADS) {
      return {
        success: false,
        error: `Download limit reached (${MAX_DOWNLOADS} downloads). Please contact support if you need more.`,
      };
    }

    // Generate download URLs
    const urlsResult = await getPurchaseDownloadUrls(
      purchase.product.slug,
      purchase.format,
      purchase.product.type
    );

    if (!urlsResult.success) {
      return { success: false, error: "Failed to generate download links" };
    }

    // Record download attempt (always, no limit)
    await prisma.download.create({
      data: {
        purchaseId: purchase.id,
        ipAddress,
        userAgent,
      },
    });

    // Increment download count
    const updated = await prisma.purchase.update({
      where: { id: purchase.id },
      data: {
        downloadCount: { increment: 1 },
      },
    });

    console.log(`✅ Download recorded for ${purchase.product.slug} (${updated.downloadCount}/${MAX_DOWNLOADS})`);

    return {
      success: true,
      urls: urlsResult.urls,
      purchase: {
        id: purchase.id,
        format: purchase.format,
        downloadCount: updated.downloadCount,
        maxDownloads: MAX_DOWNLOADS,
        expiresAt: purchase.expiresAt,
        productType: purchase.product.type,
      },
    };
  } catch (error) {
    console.error("Generate download links error:", error);
    return {
      success: false,
      error: error.message || "Failed to generate links",
    };
  }
}

/**
 * Get user's library (completed purchases)
 */
export async function getUserLibrary(userId) {
  return await prisma.purchase.findMany({
    where: {
      userId,
      paymentStatus: "COMPLETED",
    },
    include: {
      product: {
        include: {
          categories: true,
        },
      },
      downloads: {
        orderBy: {
          downloadedAt: "desc",
        },
        take: 1,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Check if download is available
 * UPDATED: 100 download limit
 */
export function getDownloadStatus(purchase) {
  const canDownload = purchase.paymentStatus === "COMPLETED" && purchase.downloadCount < MAX_DOWNLOADS;
  const limitReached = purchase.downloadCount >= MAX_DOWNLOADS;

  return {
    canDownload,
    expired: false, // Never expires
    limitReached,
    downloadsRemaining: Math.max(0, MAX_DOWNLOADS - purchase.downloadCount),
    expiresAt: null,
    downloadCount: purchase.downloadCount,
    maxDownloads: MAX_DOWNLOADS,
  };
}
