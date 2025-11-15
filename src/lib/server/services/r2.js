/**
 * @fileoverview R2 Storage Service for Klarify (FIXED PATHS)
 * Location: src/lib/server/services/r2.js
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
 * klarify/products/{productSlug}/cover.{ext}      - Cover image
 * klarify/products/{productSlug}/{slug}.pdf       - Full PDF
 * klarify/products/{productSlug}/audiobook.mp3    - Full audio (single file)
 * klarify/products/{productSlug}/chapters/{slug}_chapter_01.opus - Chapter files
 * klarify/products/{productSlug}/{slug}.audio.zip - Zipped audio chapters
 */

/**
 * Get signed URLs for all audio chapters
 * @param {string} productSlug - Product slug (e.g., 'born-a-crime')
 * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns {Promise<{success: boolean, chapters?: Array, error?: string}>}
 */
export async function getAudioChapterUrls(productSlug, expiresIn = 3600) {
  try {
    // FIXED: Include bucket name in prefix
    const prefix = `klarify/products/${productSlug}/chapters/`;

    console.log('🔍 Looking for chapters with prefix:', prefix);

    // List all chapter files
    const listCommand = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: prefix,
    });

    const listResult = await r2Client.send(listCommand);

    if (!listResult.Contents || listResult.Contents.length === 0) {
      console.log('❌ No chapters found with prefix:', prefix);
      return { success: false, error: 'No chapters found' };
    }

    console.log(`✅ Found ${listResult.Contents.length} files`);

    // Generate signed URL for each chapter
    const chapters = await Promise.all(
      listResult.Contents
        .filter(obj => obj.Key.endsWith('.opus') || obj.Key.endsWith('.mp3'))
        .sort((a, b) => a.Key.localeCompare(b.Key)) // Sort by filename
        .map(async (obj, index) => {
          const command = new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: obj.Key,
          });

          const url = await getSignedUrl(r2Client, command, { expiresIn });
          
          // Extract chapter number from filename
          const match = obj.Key.match(/chapter[_-](\d+)/i);
          const chapterNumber = match ? parseInt(match[1]) : index + 1;
          
          // Extract filename without path
          const filename = obj.Key.split('/').pop();

          console.log(`📄 Chapter ${chapterNumber}: ${filename}`);

          return {
            number: chapterNumber,
            title: `Chapter ${chapterNumber}`,
            filename,
            url,
            size: obj.Size,
            key: obj.Key,
          };
        })
    );

    return { success: true, chapters };
  } catch (error) {
    console.error('❌ Get chapter URLs failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get signed URL for zipped audio file
 * @param {string} productSlug - Product slug
 * @param {number} expiresIn - Expiration time in seconds
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function getZippedAudioUrl(productSlug, expiresIn = 3600) {
  try {
    // Try multiple naming conventions for the zip file
    const possibleKeys = [
      `klarify/products/${productSlug}/${productSlug}.audio.zip`,
      `klarify/products/${productSlug}/${productSlug.replace(/-/g, '_')}.audio.zip`,
      `klarify/products/${productSlug}/${productSlug}_audio.zip`,
    ];

    for (const key of possibleKeys) {
      console.log('🤐 Trying zip URL:', key);
      try {
        const command = new GetObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key,
        });

        const url = await getSignedUrl(r2Client, command, { expiresIn });
        console.log('✅ Zip URL generated successfully');
        return { success: true, url };
      } catch (err) {
        // Continue to next possible key
        continue;
      }
    }
    
    console.warn('⚠️ No zip file found for product:', productSlug);
    return { success: false, error: 'Zip file not found' };
  } catch (error) {
    console.error('❌ Get zip URL failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Upload a file to R2 with proper organization
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
 */
export async function getPurchaseDownloadUrls(productSlug, format) {
  try {
    const urls = {};

    if (format === "PDF" || format === "BUNDLE") {
      // FIXED: Use product slug in path
      const pdfKey = `klarify/products/${productSlug}/${productSlug}.pdf`;
      console.log('📄 Generating PDF URL for:', pdfKey);
      const pdfResult = await getSecureDownloadUrl(pdfKey, 3600);
      if (pdfResult.success) {
        urls.pdf = pdfResult.url;
      } else {
        console.error('❌ PDF URL generation failed:', pdfResult.error);
      }
    }

    if (format === "AUDIO" || format === "BUNDLE") {
      // FIXED: Use product slug in path - try multiple possible names
      const audioKeys = [
        `klarify/products/${productSlug}/${productSlug}.audio.mp3`,
        `klarify/products/${productSlug}/audiobook.mp3`,
        `klarify/products/${productSlug}/${productSlug}.mp3`,
      ];
      
      let audioFound = false;
      for (const audioKey of audioKeys) {
        console.log('🎵 Trying Audio URL for:', audioKey);
        const audioResult = await getSecureDownloadUrl(audioKey, 3600);
        if (audioResult.success) {
          urls.audio = audioResult.url;
          audioFound = true;
          console.log('✅ Audio URL generated successfully');
          break;
        }
      }
      
      if (!audioFound) {
        console.warn('⚠️ No audio file found for product:', productSlug);
      }
    }

    return { success: true, urls };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateProductPath(productSlug, fileType, extension) {
  const fileMap = {
    cover: `${productSlug}.cover.${extension}`,
    pdf: `${productSlug}.pdf`,
    audio: `${productSlug}.audio.mp3`,
    "sample-pdf": `${productSlug}.sample.pdf`,
    "sample-audio": `${productSlug}.sample.mp3`,
  };

  const filename = fileMap[fileType] || `${productSlug}.${fileType}.${extension}`;
  // FIXED: Include bucket name in path
  return `klarify/products/${productSlug}/${filename}`;
}

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
    opus: "audio/opus",
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
    
    // Archives
    zip: "application/zip",
  };

  return types[ext] || "application/octet-stream";
}

export function validateFile(file, fileType) {
  const maxSizes = {
    cover: 5 * 1024 * 1024,
    pdf: 100 * 1024 * 1024,
    audio: 500 * 1024 * 1024,
    "sample-pdf": 10 * 1024 * 1024,
    "sample-audio": 50 * 1024 * 1024,
  };

  const allowedTypes = {
    cover: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    pdf: ["application/pdf"],
    audio: ["audio/mpeg", "audio/mp3", "audio/mp4", "audio/m4a", "audio/opus"],
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

export function getCoverImageUrl(productSlug) {
  // FIXED: Include bucket name in path and use proper naming convention
  return `klarify/products/${productSlug}/${productSlug}.cover.jpg`;
}

export async function deleteProductFiles(productSlug) {
  try {
    // FIXED: Include bucket name in prefix
    const prefix = `klarify/products/${productSlug}/`;
    const listCommand = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: prefix,
    });

    const listResult = await r2Client.send(listCommand);

    if (!listResult.Contents || listResult.Contents.length === 0) {
      return { success: true, deleted: 0 };
    }

    let deleted = 0;
    for (const object of listResult.Contents) {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: object.Key,
      });
      await r2Client.send(deleteCommand);
      deleted++;
    }

    console.log(`🗑️ Deleted ${deleted} files for product ${productSlug}`);
    return { success: true, deleted };
  } catch (error) {
    console.error("❌ Delete failed:", error);
    return { success: false, error: error.message };
  }
}

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
