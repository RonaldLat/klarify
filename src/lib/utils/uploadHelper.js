/**
 * @fileoverview Client-side upload helper with chunking and progress tracking
 * Location: src/lib/utils/uploadHelper.js
 */

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024; // 10MB

/**
 * Upload a file with progress tracking
 * @param {File} file - File to upload
 * @param {string} productId - Product ID
 * @param {string} fileType - Type of file (cover, pdf, audio, sample-pdf, sample-audio)
 * @param {Function} onProgress - Progress callback (percentage)
 * @returns {Promise<{success: boolean, key?: string, error?: string}>}
 */
export async function uploadFileWithProgress(
  file,
  productId,
  fileType,
  onProgress,
) {
  if (!file) {
    return { success: false, error: "No file provided" };
  }

  try {
    // For small files, use direct upload
    if (file.size < LARGE_FILE_THRESHOLD) {
      return await directUpload(file, productId, fileType, onProgress);
    }

    // For large files, use chunked upload
    return await chunkedUpload(file, productId, fileType, onProgress);
  } catch (error) {
    console.error("Upload error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Direct upload for small files
 */
async function directUpload(file, productId, fileType, onProgress) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("productId", productId);
  formData.append("fileType", fileType);

  const xhr = new XMLHttpRequest();

  return new Promise((resolve, reject) => {
    // Track upload progress
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const percentage = Math.round((e.loaded / e.total) * 100);
        onProgress(percentage);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        resolve(response);
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error during upload"));
    });

    xhr.open("POST", "/api/upload/direct");
    xhr.send(formData);
  });
}

/**
 * Chunked upload for large files
 */
async function chunkedUpload(file, productId, fileType, onProgress) {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

  // Step 1: Initialize upload session
  const initFormData = new FormData();
  initFormData.append("action", "init");
  initFormData.append("fileName", file.name);
  initFormData.append("fileSize", file.size.toString());
  initFormData.append("fileType", fileType);
  initFormData.append("productId", productId);
  initFormData.append("totalChunks", totalChunks.toString());

  const initResponse = await fetch("/api/upload/chunk", {
    method: "POST",
    body: initFormData,
  });

  if (!initResponse.ok) {
    throw new Error("Failed to initialize upload");
  }

  const { sessionId } = await initResponse.json();

  // Step 2: Upload chunks
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

    const chunkFormData = new FormData();
    chunkFormData.append("action", "upload");
    chunkFormData.append("sessionId", sessionId);
    chunkFormData.append("chunkIndex", i.toString());
    chunkFormData.append("chunk", chunk);

    const chunkResponse = await fetch("/api/upload/chunk", {
      method: "POST",
      body: chunkFormData,
    });

    if (!chunkResponse.ok) {
      // Cancel upload on error
      await cancelUpload(sessionId);
      throw new Error(`Chunk ${i + 1} upload failed`);
    }

    const { progress } = await chunkResponse.json();
    onProgress(progress);
  }

  // Step 3: Finalize upload
  const finalizeFormData = new FormData();
  finalizeFormData.append("action", "finalize");
  finalizeFormData.append("sessionId", sessionId);

  const finalizeResponse = await fetch("/api/upload/chunk", {
    method: "POST",
    body: finalizeFormData,
  });

  if (!finalizeResponse.ok) {
    throw new Error("Failed to finalize upload");
  }

  const result = await finalizeResponse.json();
  onProgress(100);

  return result;
}

/**
 * Cancel an ongoing upload
 */
async function cancelUpload(sessionId) {
  const formData = new FormData();
  formData.append("action", "cancel");
  formData.append("sessionId", sessionId);

  try {
    await fetch("/api/upload/chunk", {
      method: "POST",
      body: formData,
    });
  } catch (error) {
    console.error("Failed to cancel upload:", error);
  }
}

/**
 * Upload multiple files sequentially with overall progress
 * @param {Array<{file: File, productId: string, fileType: string}>} uploads
 * @param {Function} onProgress - Progress callback (current file index, overall percentage)
 * @returns {Promise<Array<{success: boolean, key?: string, fileType: string}>>}
 */
export async function uploadMultipleFiles(uploads, onProgress) {
  const results = [];
  const totalFiles = uploads.length;

  for (let i = 0; i < uploads.length; i++) {
    const { file, productId, fileType } = uploads[i];

    const result = await uploadFileWithProgress(
      file,
      productId,
      fileType,
      (fileProgress) => {
        // Calculate overall progress
        const overallProgress = Math.round(
          ((i + fileProgress / 100) / totalFiles) * 100,
        );
        onProgress(i, fileProgress, overallProgress);
      },
    );

    results.push({ ...result, fileType });

    // Stop if any upload fails
    if (!result.success) {
      break;
    }
  }

  return results;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
