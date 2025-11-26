/**
 * @fileoverview Download service - handles secure file downloads
 * UPDATED: Removed download limits, only requires authentication
 */
import { prisma } from "$lib/server/prisma.js";
import { getPurchaseDownloadUrls } from "$lib/server/services/r2.js";

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
      return { success: false, error: "Unauthorized" };
    }

    // Check payment status
    if (purchase.paymentStatus !== "COMPLETED") {
      return { success: false, error: "Payment not completed" };
    }

    // REMOVED: Download count check
    // REMOVED: Expiration check (downloads never expire)

    // Log product info for debugging
    console.log('🔍 Generating download URLs for product:', purchase.product.slug);
    console.log('📦 Product type:', purchase.product.type);
    
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

    // Increment download count (for analytics only, not enforced)
    await prisma.purchase.update({
      where: { id: purchase.id },
      data: {
        downloadCount: { increment: 1 },
      },
    });

    return {
      success: true,
      urls: urlsResult.urls,
      purchase: {
        id: purchase.id,
        format: purchase.format,
        downloadCount: purchase.downloadCount + 1,
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
 * UPDATED: Always available for completed purchases
 */
export function getDownloadStatus(purchase) {
  const canDownload = purchase.paymentStatus === "COMPLETED";

  return {
    canDownload,
    expired: false, // Never expires
    limitReached: false, // No limit
    downloadsRemaining: 100, // Unlimited
    expiresAt: null,
    downloadCount: purchase.downloadCount,
    // maxDownloads: null, // No max
    maxDownloads: 100, // No max
  };
}
