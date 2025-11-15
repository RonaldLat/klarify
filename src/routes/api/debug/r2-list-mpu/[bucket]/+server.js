/**
 * DEBUG: List all multipart uploads in a bucket
 * DELETE AFTER USE
 */
import { json } from '@sveltejs/kit';
import { r2Client } from '$lib/server/services/r2.js';
import { ListMultipartUploadsCommand } from '@aws-sdk/client-s3';

export async function GET({ params }) {
  const { bucket } = params;

  const ALLOWED = ['klarify', 'testron', 'uploads', 'temp', 'backups'];
  if (!ALLOWED.includes(bucket)) {
  }

  try {
    const command = new ListMultipartUploadsCommand({ Bucket: bucket });
    const response = await r2Client.send(command);

    return json({
      success: true,
      bucket,
      uploads: (response.Uploads || []).map(u => ({
        key: u.Key,
        uploadId: u.UploadId,
        initiated: u.Initiated
      })),
      isTruncated: response.IsTruncated
    });

  } catch (error) {
    const details = {
      message: error.message || 'Unknown error',
      name: error.name,
      code: error.$metadata?.httpStatusCode || error.code,
      bucket
    };
    console.error('List MPU failed:', details);
    return json({ success: false, error: 'List failed', details }, { status: 500 });
  }
}
