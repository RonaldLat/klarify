/**
 * @fileoverview Download service - handles secure file downloads
 * UPDATED: Now supports SUMMARY type products
 */
import { prisma } from "$lib/server/prisma.js";
import { getPurchaseDownloadUrls } from "$lib/server/services/r2.js";

/**
 * Generate secure download links for a purchase
 * @param {string} purchaseId
 * @param {string} userId
 * @param {string} ipAddress
 * @param {string} userAgent
 * @returns {Promise<{success: boolean, urls?: Object, error?: string}>}
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

    // Check expiration
    if (new Date() > new Date(purchase.expiresAt)) {
      return { success: false, error: "Download period expired (48 hours)" };
    }

    // Check download limit
    if (purchase.downloadCount >= purchase.maxDownloads) {
      return {
        success: false,
        error: `Download limit reached (${purchase.maxDownloads} downloads)`,
      };
    }

    // Log product info for debugging
    console.log('🔍 Generating download URLs for product:', purchase.product.slug);
    console.log('📦 Product type:', purchase.product.type);
    
    // CHANGE #1: Pass product type to R2 service (3rd parameter)
    const urlsResult = await getPurchaseDownloadUrls(
      purchase.product.slug,
      purchase.format,
      purchase.product.type  // ← ADDED THIS LINE
    );

    if (!urlsResult.success) {
      return { success: false, error: "Failed to generate download links" };
    }

    // Record download attempt
    await prisma.download.create({
      data: {
        purchaseId: purchase.id,
        ipAddress,
        userAgent,
      },
    });

    // Increment download count
    await prisma.purchase.update({
      where: { id: purchase.id },
      data: {
        downloadCount: { increment: 1 },
      },
    });

    // CHANGE #2: Include product type in response
    return {
      success: true,
      urls: urlsResult.urls,
      purchase: {
        id: purchase.id,
        format: purchase.format,
        downloadCount: purchase.downloadCount + 1,
        maxDownloads: purchase.maxDownloads,
        expiresAt: purchase.expiresAt,
        productType: purchase.product.type,  // ← ADDED THIS LINE
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
 * @param {string} userId
 * @returns {Promise<Array>}
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
        take: 1, // Get most recent download
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Check if download is available
 * @param {Object} purchase
 * @returns {Object}
 */
export function getDownloadStatus(purchase) {
  const now = new Date();
  const expired = now > new Date(purchase.expiresAt);
  const limitReached = purchase.downloadCount >= purchase.maxDownloads;
  const canDownload =
    !expired && !limitReached && purchase.paymentStatus === "COMPLETED";

  return {
    canDownload,
    expired,
    limitReached,
    downloadsRemaining: Math.max(
      0,
      purchase.maxDownloads - purchase.downloadCount,
    ),
    expiresAt: purchase.expiresAt,
    downloadCount: purchase.downloadCount,
    maxDownloads: purchase.maxDownloads,
  };
}
