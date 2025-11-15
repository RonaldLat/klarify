/**
 * @fileoverview R2 Storage Service for Klarify (FIXED for correct paths)
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
 * CORRECT R2 Structure:
 * AUDIOBOOKS:
 * - products/{slug}/audio/{slug}_chapter_01.opus
 * - products/{slug}/{slug}.cover.jpg
 * 
 * SUMMARIES:
 * - summaries/{slug}/audio/{slug}_SUMMARY.opus
 * - summaries/{slug}/{slug}.cover.jpg
 */

/**
 * Get signed URLs for all audio chapters (AUDIOBOOKS)
 * @param {string} productSlug - Product slug
 * @param {number} expiresIn - Expiration time in seconds
 * @returns {Promise<{success: boolean, chapters?: Array, error?: string}>}
 */
export async function getAudioChapterUrls(productSlug, expiresIn = 3600) {
  try {
    // FIXED: Correct path without 'klarify/' prefix
    const prefix = `products/${productSlug}/audio/`;

    console.log('🔍 Looking for audiobook chapters with prefix:', prefix);

    const listCommand = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: prefix,
    });

    const listResult = await r2Client.send(listCommand);

    if (!listResult.Contents || listResult.Contents.length === 0) {
      console.log('❌ No chapters found with prefix:', prefix);
      return { success: false, error: 'No chapters found' };
    }

    console.log(`✅ Found ${listResult.Contents.length} chapter files`);

    // Generate signed URL for each chapter
    const chapters = await Promise.all(
      listResult.Contents
        .filter(obj => obj.Key.endsWith('.opus') || obj.Key.endsWith('.mp3'))
        .sort((a, b) => a.Key.localeCompare(b.Key))
        .map(async (obj, index) => {
          const command = new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: obj.Key,
          });

          const url = await getSignedUrl(r2Client, command, { expiresIn });
          
          // Extract chapter number from filename
          const match = obj.Key.match(/chapter[_-](\d+)/i);
          const chapterNumber = match ? parseInt(match[1]) : index + 1;
          
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
 * Get signed URL for summary audio file (SUMMARIES)
 * @param {string} productSlug - Summary product slug
 * @param {number} expiresIn - Expiration time in seconds
 * @returns {Promise<{success: boolean, url?: string, key?: string, error?: string}>}
 */
export async function getSummaryAudioUrl(productSlug, expiresIn = 3600) {
  try {
    // FIXED: Correct path - summaries/{slug}/audio/{slug}_SUMMARY.opus
    const key = `summaries/${productSlug}/audio/${productSlug}_SUMMARY.opus`;

    console.log('🎧 Looking for summary audio:', key);

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(r2Client, command, { expiresIn });
    console.log('✅ Summary audio URL generated:', key);
    
    return { success: true, url, key };
  } catch (error) {
    console.error('❌ Get summary audio URL failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get zipped audio URL for audiobooks (if available)
 * @param {string} productSlug - Product slug
 * @param {number} expiresIn - Expiration time in seconds
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function getZippedAudioUrl(productSlug, expiresIn = 3600) {
  try {
    const key = `products/${productSlug}/${productSlug}.audio.zip`;

    console.log('🤐 Trying zip URL:', key);
    
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(r2Client, command, { expiresIn });
    console.log('✅ Zip URL generated successfully');
    return { success: true, url };
  } catch (error) {
    console.warn('⚠️ No zip file found for product:', productSlug);
    return { success: false, error: 'Zip file not found' };
  }
}

/**
 * Get purchase download URLs (PDF + Audio)
 * UPDATED: Now supports correct paths for summaries and audiobooks
 */
export async function getPurchaseDownloadUrls(productSlug, format, productType = null) {
  try {
    const urls = {};

    // Handle SUMMARIES
    if (productType === 'SUMMARY') {
      console.log('📦 Getting summary download URL for:', productSlug);
      const summaryResult = await getSummaryAudioUrl(productSlug, 3600);
      if (summaryResult.success) {
        urls.audio = summaryResult.url;
        return { success: true, urls };
      } else {
        console.error('❌ Summary audio not found');
        return { success: false, error: 'Summary audio not found' };
      }
    }

    // Handle PDF downloads
    if (format === "PDF" || format === "BUNDLE") {
      const pdfKey = `products/${productSlug}/${productSlug}.pdf`;
      console.log('📄 Generating PDF URL for:', pdfKey);
      const pdfResult = await getSecureDownloadUrl(pdfKey, 3600);
      if (pdfResult.success) {
        urls.pdf = pdfResult.url;
      } else {
        console.error('❌ PDF URL generation failed:', pdfResult.error);
      }
    }

    // Handle AUDIO downloads (try single file first, then zip)
    if (format === "AUDIO" || format === "BUNDLE") {
      // Try single audio file first
      const audioKeys = [
        `products/${productSlug}/${productSlug}.audio.mp3`,
        `products/${productSlug}/audiobook.mp3`,
        `products/${productSlug}/${productSlug}.mp3`,
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
      
      // If no single file, try zip
      if (!audioFound) {
        const zipResult = await getZippedAudioUrl(productSlug, 3600);
        if (zipResult.success) {
          urls.audio = zipResult.url;
          console.log('✅ Using zip file for audio download');
        } else {
          console.warn('⚠️ No audio file found for product:', productSlug);
        }
      }
    }

    return { success: true, urls };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Generate a signed download URL
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
    console.error('❌ URL generation failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Upload product file
 */
export async function uploadProductFile(fileData, productId, fileType, extension) {
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
 * Helper: Generate product path
 */
function generateProductPath(productSlug, fileType, extension) {
  const fileMap = {
    cover: `${productSlug}.cover.${extension}`,
    pdf: `${productSlug}.pdf`,
    audio: `${productSlug}.audio.mp3`,
    "sample-pdf": `${productSlug}.sample.pdf`,
    "sample-audio": `${productSlug}.sample.mp3`,
  };

  const filename = fileMap[fileType] || `${productSlug}.${fileType}.${extension}`;
  return `products/${productSlug}/${filename}`;
}

/**
 * Helper: Get content type
 */
function getContentType(extension) {
  const ext = extension.toLowerCase();
  const types = {
    mp3: "audio/mpeg",
    opus: "audio/opus",
    mp4: "audio/mp4",
    m4a: "audio/mp4",
    m4b: "audio/mp4",
    ogg: "audio/ogg",
    wav: "audio/wav",
    pdf: "application/pdf",
    epub: "application/epub+zip",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    zip: "application/zip",
  };

  return types[ext] || "application/octet-stream";
}

/**
 * Get cover image URL
 */
export function getCoverImageUrl(productSlug) {
  // FIXED: Include bucket name in path and use proper naming convention
  return `products/${productSlug}/${productSlug}.cover.jpg`;
}

export function getSummaryCoverImageUrl(productSlug) {
  return `summaries/${productSlug}/${productSlug}.cover.jpg`;
}

/**
 * Delete product files
 */
export async function deleteProductFiles(productSlug) {
  try {
    const prefix = `products/${productSlug}/`;
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

export async function deleteSummaryFiles(productSlug) {
  try {
    const prefix = `summaries/${productSlug}/`;
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

    console.log(`🗑️ Deleted ${deleted} summary files for ${productSlug}`);
    return { success: true, deleted };
  } catch (error) {
    console.error("❌ Delete summary files failed:", error);
    return { success: false, error: error.message };
  }
}
