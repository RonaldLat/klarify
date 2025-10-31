/**
 * @fileoverview R2 Storage Service for Klarify
 * Handles file uploads, downloads, and URL generation for products
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME,
} from "$env/static/private";

// Initialize R2 Client
export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Product file structure in R2:
 * products/{productId}/cover.{ext}      - Cover image
 * products/{productId}/book.pdf         - Full PDF
 * products/{productId}/audiobook.mp3    - Full audio
 * products/{productId}/sample.pdf       - PDF preview (first chapter)
 * products/{productId}/sample.mp3       - Audio preview (5min)
 */

/**
 * Upload a file to R2 with proper organization
 * @param {Buffer|Uint8Array|Blob} fileData - File content
 * @param {string} productId - Product ID (cuid)
 * @param {'cover'|'pdf'|'audio'|'sample-pdf'|'sample-audio'} fileType
 * @param {string} extension - File extension (e.g., 'jpg', 'pdf', 'mp3')
 * @returns {Promise<{success: boolean, key?: string, error?: string}>}
 */
export async function uploadProductFile(
  fileData,
  productId,
  fileType,
  extension,
) {
  try {
    const key = generateProductPath(productId, fileType, extension);

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: fileData,
      ContentType: getContentType(extension),
      // Make cover images public, keep content files private
      // ACL: fileType === 'cover' ? 'public-read' : 'private'
    });

    await r2Client.send(command);
    console.log(`✅ Uploaded: ${key}`);

    return { success: true, key };
  } catch (error) {
    console.error("❌ Upload failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate a signed download URL with expiration
 * @param {string} key - R2 object key
 * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function getSecureDownloadUrl(key, expiresIn = 3600) {
  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(r2Client, command, { expiresIn });
    return { success: true, url };
  } catch (error) {
    console.error("❌ URL generation failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate multiple download URLs for a purchase (PDF + Audio bundle)
 * @param {string} productId
 * @param {'PDF'|'AUDIO'|'BUNDLE'} format
 * @returns {Promise<{success: boolean, urls?: Object, error?: string}>}
 */
export async function getPurchaseDownloadUrls(productId, format) {
  try {
    const urls = {};

    if (format === "PDF" || format === "BUNDLE") {
      const pdfKey = generateProductPath(productId, "pdf", "pdf");
      const pdfResult = await getSecureDownloadUrl(pdfKey, 3600);
      if (pdfResult.success) urls.pdf = pdfResult.url;
    }

    if (format === "AUDIO" || format === "BUNDLE") {
      const audioKey = generateProductPath(productId, "audio", "mp3");
      const audioResult = await getSecureDownloadUrl(audioKey, 3600);
      if (audioResult.success) urls.audio = audioResult.url;
    }

    return { success: true, urls };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get public URL for cover images (no signing needed if public)
 * @param {string} productId
 * @returns {string}
 */
export function getCoverImageUrl(productId) {
  // If you set up a custom domain for R2, use it here
  // Otherwise, generate a signed URL for covers too
  return `products/${productId}/cover.jpg`;
}

/**
 * Delete all files associated with a product
 * @param {string} productId
 * @returns {Promise<{success: boolean, deleted?: number, error?: string}>}
 */
export async function deleteProductFiles(productId) {
  try {
    const prefix = `products/${productId}/`;

    // List all objects with this prefix
    const listCommand = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: prefix,
    });

    const listResult = await r2Client.send(listCommand);

    if (!listResult.Contents || listResult.Contents.length === 0) {
      return { success: true, deleted: 0 };
    }

    // Delete each object
    let deleted = 0;
    for (const object of listResult.Contents) {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: object.Key,
      });
      await r2Client.send(deleteCommand);
      deleted++;
    }

    console.log(`🗑️ Deleted ${deleted} files for product ${productId}`);
    return { success: true, deleted };
  } catch (error) {
    console.error("❌ Delete failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a specific file
 * @param {string} key - Full R2 object key
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteFile(key) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });
    await r2Client.send(command);
    console.log(`🗑️ Deleted: ${key}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Delete failed:", error);
    return { success: false, error: error.message };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate standardized R2 path for product files
 * @param {string} productId
 * @param {'cover'|'pdf'|'audio'|'sample-pdf'|'sample-audio'} fileType
 * @param {string} extension
 * @returns {string}
 */
function generateProductPath(productId, fileType, extension) {
  const fileMap = {
    cover: `cover.${extension}`,
    pdf: "book.pdf",
    audio: "audiobook.mp3",
    "sample-pdf": "sample.pdf",
    "sample-audio": "sample.mp3",
  };

  const filename = fileMap[fileType] || `${fileType}.${extension}`;
  return `products/${productId}/${filename}`;
}

/**
 * Get MIME content type from file extension
 * @param {string} extension
 * @returns {string}
 */
function getContentType(extension) {
  const ext = extension.toLowerCase();
  const types = {
    // Audio
    mp3: "audio/mpeg",
    mp4: "audio/mp4",
    m4a: "audio/mp4",
    m4b: "audio/mp4",
    aac: "audio/aac",
    ogg: "audio/ogg",
    wav: "audio/wav",

    // Documents
    pdf: "application/pdf",
    epub: "application/epub+zip",
    mobi: "application/x-mobipocket-ebook",

    // Images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    svg: "image/svg+xml",
  };

  return types[ext] || "application/octet-stream";
}

/**
 * Validate file type and size
 * @param {File} file - Browser File object
 * @param {'cover'|'pdf'|'audio'|'sample-pdf'|'sample-audio'} fileType
 * @returns {{valid: boolean, error?: string}}
 */
export function validateFile(file, fileType) {
  const maxSizes = {
    cover: 5 * 1024 * 1024, // 5MB
    pdf: 100 * 1024 * 1024, // 100MB
    audio: 500 * 1024 * 1024, // 500MB
    "sample-pdf": 10 * 1024 * 1024, // 10MB
    "sample-audio": 50 * 1024 * 1024, // 50MB
  };

  const allowedTypes = {
    cover: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    pdf: ["application/pdf"],
    audio: ["audio/mpeg", "audio/mp3", "audio/mp4", "audio/m4a"],
    "sample-pdf": ["application/pdf"],
    "sample-audio": ["audio/mpeg", "audio/mp3", "audio/mp4", "audio/m4a"],
  };

  if (file.size > maxSizes[fileType]) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${Math.round(maxSizes[fileType] / 1024 / 1024)}MB`,
    };
  }

  if (!allowedTypes[fileType].includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedTypes[fileType].join(", ")}`,
    };
  }

  return { valid: true };
}
