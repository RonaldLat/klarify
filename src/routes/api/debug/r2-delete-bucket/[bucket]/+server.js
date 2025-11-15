/**
 * DEBUG ENDPOINT - Delete ALL files in a specified R2 bucket
 * Location: src/routes/api/debug/r2-delete-bucket/[bucket]/+server.js
 * DELETE THIS FILE AFTER USE
 *
 * Usage: DELETE /api/debug/r2-delete-bucket/klarify
 *
 * WARNING: This permanently deletes EVERYTHING in the specified bucket.
 */
import { json } from '@sveltejs/kit';
import { r2Client } from '$lib/server/services/r2.js';
import { ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ params }) {
  const { bucket } = params;

  if (!bucket) {
    return json(
      { success: false, error: 'Bucket name is required' },
      { status: 400 }
    );
  }

const ALLOWED_BUCKETS = ['klarify', 'uploads', 'temp', 'backups', 'testron','ebooks'];
  if (!ALLOWED_BUCKETS.includes(bucket)) {
    return json(
      { success: false, error: `Bucket '${bucket}' is not allowed for deletion` },
      { status: 403 }
    );
  }

  try {
    let isTruncated = true;
    let continuationToken = null;
    let totalDeleted = 0;
    const deletedKeys = []; // ← Removed `: string[]`

    console.log(`Starting deletion of ALL objects in bucket: ${bucket}`);

    while (isTruncated) {
      const listCommand = new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken,
      });

      const listResponse = await r2Client.send(listCommand);
      const objects = listResponse.Contents || [];

      if (objects.length > 0) {
        const deleteCommand = new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: {
            Objects: objects.map(obj => ({ Key: obj.Key })),
            Quiet: false,
          },
        });

        const deleteResponse = await r2Client.send(deleteCommand);
        const deleted = deleteResponse.Deleted || [];
        const errors = deleteResponse.Errors || [];

        totalDeleted += deleted.length;
        deletedKeys.push(...deleted.map(d => d.Key));

        if (errors.length > 0) {
          console.error(`Failed to delete ${errors.length} objects:`, errors);
        }

        console.log(`Deleted ${deleted.length} objects (batch)`);
      }

      isTruncated = listResponse.IsTruncated ?? false;
      continuationToken = listResponse.NextContinuationToken;
    }

    console.log(`Successfully deleted ${totalDeleted} objects from bucket: ${bucket}`);

    return json({
      success: true,
      message: `Deleted ${totalDeleted} objects from bucket '${bucket}'`,
      bucket,
      deletedCount: totalDeleted,
      sampleDeletedKeys: deletedKeys.slice(0, 100),
      totalKeysReturned: deletedKeys.length,
    });

  } catch (error) {
    console.error(`Failed to delete contents of bucket '${bucket}':`, error);
    return json(
      {
        success: false,
        error: 'Failed to delete bucket contents',
        bucket,
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
