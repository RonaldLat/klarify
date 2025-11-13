/**
 * @fileoverview Download endpoint - generates secure download links
 * File: /routes/download/[purchaseId]/+server.js
 */
import { json } from "@sveltejs/kit";
import { generateDownloadLinks } from "$lib/server/services/download.js";

/** @type {import('./$types').RequestHandler} */
export async function GET({ params, locals, request }) {
  // Check authentication
  if (!locals.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const { purchaseId } = params;

  // Get client info
  const ipAddress =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  // Generate download links
  const result = await generateDownloadLinks(
    purchaseId,
    locals.user.id,
    ipAddress,
    userAgent,
  );

  if (!result.success) {
    return json({ error: result.error }, { status: 400 });
  }

  return json({
    success: true,
    urls: result.urls,
    purchase: result.purchase,
  });
}
