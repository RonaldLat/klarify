import { redirect, error } from "@sveltejs/kit";
import { prisma } from "$lib/server/prisma.js";
import { getDownloadStatus } from "$lib/server/services/download.js";

export async function load({ params, locals }) {
  if (!locals.user) {
    throw redirect(303, "/login");
  }

  const { purchaseId } = params;

  try {
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        product: {
          select: {
            id: true,
            slug: true,
            title: true,
            author: true,
            type: true,
            duration: true,
            keyTakeaways: true,
            coverImage: true,
          }
        },
        downloads: {
          orderBy: { downloadedAt: "desc" },
          take: 5,
        },
      },
    });

    if (!purchase) {
      throw error(404, "Purchase not found");
    }

    if (purchase.userId !== locals.user.id) {
      throw error(403, "Unauthorized");
    }

    const downloadStatus = getDownloadStatus(purchase);

    return {
      purchase: {
        id: purchase.id,
        format: purchase.format,
        amount: purchase.amount,
        createdAt: purchase.createdAt,
        downloadCount: purchase.downloadCount,
        maxDownloads: purchase.maxDownloads,
        expiresAt: purchase.expiresAt,
        paymentStatus: purchase.paymentStatus,
        downloadToken: purchase.downloadToken,
        product: purchase.product,
      },
      downloadStatus,
      downloads: purchase.downloads,
    };
  } catch (err) {
    console.error("Download page load error:", err);
    
    if (err.status) {
      throw err;
    }
    
    throw error(500, "Failed to load download page");
  }
}
