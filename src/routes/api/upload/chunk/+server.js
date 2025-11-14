/**
 * @fileoverview Chunked upload endpoint for large files
 * Location: src/routes/api/upload/chunk/+server.js
 */

import { json, error } from "@sveltejs/kit";
import { uploadProductFile } from "$lib/server/services/r2.js";
import { prisma } from "$lib/server/prisma.js";

// Store upload sessions in memory (use Redis in production)
const uploadSessions = new Map();

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
  // Check admin auth
  if (!locals.user || locals.user.role !== "admin") {
    throw error(401, "Unauthorized");
  }

  try {
    const formData = await request.formData();
    const action = formData.get("action")?.toString();

    // Initialize upload session
    if (action === "init") {
      const sessionId = crypto.randomUUID();
      const fileName = formData.get("fileName")?.toString();
      const fileSize = parseInt(formData.get("fileSize")?.toString() || "0");
      const fileType = formData.get("fileType")?.toString();
      const productId = formData.get("productId")?.toString();
      const totalChunks = parseInt(
        formData.get("totalChunks")?.toString() || "1",
      );

      uploadSessions.set(sessionId, {
        fileName,
        fileSize,
        fileType,
        productId,
        totalChunks,
        chunks: new Array(totalChunks),
        uploadedChunks: 0,
        createdAt: Date.now(),
      });

      return json({
        success: true,
        sessionId,
        message: "Upload session initialized",
      });
    }

    // Upload chunk
    if (action === "upload") {
      const sessionId = formData.get("sessionId")?.toString();
      const chunkIndex = parseInt(
        formData.get("chunkIndex")?.toString() || "0",
      );
      const chunk = formData.get("chunk");

      if (!sessionId || !uploadSessions.has(sessionId)) {
        throw error(400, "Invalid upload session");
      }

      const session = uploadSessions.get(sessionId);

      // Store chunk as Buffer
      const chunkBuffer = Buffer.from(await chunk.arrayBuffer());
      session.chunks[chunkIndex] = chunkBuffer;
      session.uploadedChunks++;

      return json({
        success: true,
        uploadedChunks: session.uploadedChunks,
        totalChunks: session.totalChunks,
        progress: Math.round(
          (session.uploadedChunks / session.totalChunks) * 100,
        ),
      });
    }

    // Finalize upload - combine chunks and upload to R2
    if (action === "finalize") {
      const sessionId = formData.get("sessionId")?.toString();

      if (!sessionId || !uploadSessions.has(sessionId)) {
        throw error(400, "Invalid upload session");
      }

      const session = uploadSessions.get(sessionId);

      // Verify all chunks received
      if (session.uploadedChunks !== session.totalChunks) {
        throw error(
          400,
          `Missing chunks: ${session.uploadedChunks}/${session.totalChunks}`,
        );
      }

      // Combine all chunks
      const completeFile = Buffer.concat(session.chunks);

      // Determine file extension
      const extension = session.fileName.split(".").pop();

      // Upload to R2
      const uploadResult = await uploadProductFile(
        completeFile,
        session.productId,
        session.fileType,
        extension,
      );

      if (!uploadResult.success) {
        throw error(500, `R2 upload failed: ${uploadResult.error}`);
      }

      // Clean up session
      uploadSessions.delete(sessionId);

      return json({
        success: true,
        key: uploadResult.key,
        message: "Upload completed successfully",
      });
    }

    // Cancel upload
    if (action === "cancel") {
      const sessionId = formData.get("sessionId")?.toString();
      if (sessionId && uploadSessions.has(sessionId)) {
        uploadSessions.delete(sessionId);
      }
      return json({ success: true, message: "Upload cancelled" });
    }

    throw error(400, "Invalid action");
  } catch (err) {
    console.error("❌ Chunk upload error:", err);
    throw error(500, err.message || "Upload failed");
  }
}

// Cleanup old sessions (run periodically)
setInterval(
  () => {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour

    for (const [sessionId, session] of uploadSessions.entries()) {
      if (now - session.createdAt > maxAge) {
        uploadSessions.delete(sessionId);
        console.log(`🧹 Cleaned up stale upload session: ${sessionId}`);
      }
    }
  },
  5 * 60 * 1000,
); // Run every 5 minutes
