/**
 * @fileoverview Direct upload endpoint for small files (<10MB)
 * Location: src/routes/api/upload/direct/+server.js
 */

import { json, error } from "@sveltejs/kit";
import { uploadProductFile } from "$lib/server/services/r2.js";

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
  // Check admin auth
  if (!locals.user || locals.user.role !== "admin") {
    throw error(401, "Unauthorized");
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const productId = formData.get("productId")?.toString();
    const fileType = formData.get("fileType")?.toString();

    if (!file || !productId || !fileType) {
      throw error(400, "Missing required fields");
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = file.name.split(".").pop();

    // Upload to R2
    const result = await uploadProductFile(
      buffer,
      productId,
      fileType,
      extension,
    );

    if (!result.success) {
      throw error(500, result.error || "Upload failed");
    }

    return json({
      success: true,
      key: result.key,
      fileType,
    });
  } catch (err) {
    console.error("❌ Direct upload error:", err);
    throw error(500, err.message || "Upload failed");
  }
}
