/**
 * DEBUG ENDPOINT - Abort ALL multipart uploads in a bucket
 * Location: src/routes/api/debug/r2-abort-mpu/[bucket]/+server.js
 * DELETE THIS FILE AFTER USE
 *
 * Usage: DELETE /api/debug/r2-abort-mpu/klarify
 *
 * WARNING: Aborts every in-progress multipart upload.
 */
import { json } from '@sveltejs/kit';
import { r2Client } from '$lib/server/services/r2.js';
import {
  ListMultipartUploadsCommand,
  AbortMultipartUploadCommand
} from '@aws-sdk/client-s3';

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ params }) {
  const { bucket } = params;

  if (!bucket) {
    return json(
      { success: false, error: 'Bucket name is required' },
      { status: 400 }
    );
  }

  // ---- SAFETY WHITELIST (same as delete endpoint) ----
  const ALLOWED_BUCKETS = ['klarify', 'uploads', 'temp', 'backups', 'testron'];
  if (!ALLOWED_BUCKETS.includes(bucket)) {
    return json(
      { success: false, error: `Bucket '${bucket}' is not allowed` },
      { status: 403 }
    );
  }

  try {
    let isTruncated = true;
    let keyMarker = null;
    let uploadIdMarker = null;
    let totalAborted = 0;
    const abortedList = [];

    console.log(`Starting abort of multipart uploads in bucket: ${bucket}`);

    while (isTruncated) {
      const listCmd = new ListMultipartUploadsCommand({
        Bucket: bucket,
        KeyMarker: keyMarker,
        UploadIdMarker: uploadIdMarker
      });

      const listResp = await r2Client.send(listCmd);
      const uploads = listResp.Uploads || [];

      for (const up of uploads) {
        const abortCmd = new AbortMultipartUploadCommand({
          Bucket: bucket,
          Key: up.Key,
          UploadId: up.UploadId
        });

        try {
          await r2Client.send(abortCmd);
          totalAborted++;
          abortedList.push({ key: up.Key, uploadId: up.UploadId });
          console.log(`Aborted MPU: ${up.Key} (ID: ${up.UploadId})`);
        } catch (err) {
          console.error(`Failed to abort ${up.Key}:`, {
            message: err.message,
            code: err.$metadata?.httpStatusCode || err.code
          });
        }
      }

      isTruncated = listResp.IsTruncated ?? false;
      keyMarker = listResp.NextKeyMarker;
      uploadIdMarker = listResp.NextUploadIdMarker;
    }

    console.log(`Finished – aborted ${totalAborted} multipart upload(s) in ${bucket}`);

    return json({
      success: true,
      message: `Aborted ${totalAborted} multipart upload(s) in bucket '${bucket}'`,
      bucket,
      abortedCount: totalAborted,
      abortedUploads: abortedList.slice(0, 100),
      totalReturned: abortedList.length
    });

  } catch (error) {
    const details = {
      message: error.message || 'Unknown error',
      name: error.name || 'Error',
      code: error.$metadata?.httpStatusCode || error.code || 'N/A',
      bucket
    };

    console.error('ABORT MPU FAILED:', JSON.stringify(details, null, 2));

    return json(
      {
        success: false,
        error: 'Failed to abort multipart uploads',
        bucket,
        details: details.message,
        code: details.code,
        name: details.name
      },
      { status: 500 }
    );
  }
}
