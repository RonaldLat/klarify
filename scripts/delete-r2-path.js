/**
 * Script to recursively delete all objects under a specific R2 prefix (folder)
 * using the AWS SDK v3 for Node.js.
 * * RUN COMMAND EXAMPLE: 
 * node scripts/delete-r2-path.js klarify/products/my-product-slug/
 */
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import 'dotenv/config';
import * as readline from 'readline/promises';

// --- Configuration ---
const MAX_BATCH_SIZE = 1000; 

// --- R2 Client Setup ---
const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

// -------------------------------------------------------------

async function deleteR2Path() {
    // Read the target prefix from the command line arguments
    const R2_TARGET_PREFIX = process.argv[2];

    if (!R2_TARGET_PREFIX) {
        console.error("❌ Error: Please provide the R2 prefix/path as a command-line argument.");
        console.log("Example: node scripts/delete-r2-path.js klarify/products/my-slug/");
        return;
    }

    console.log(`\n======================================================`);
    console.log(`⚠️  DANGER ZONE: Preparing to delete all objects under:`);
    console.log(`BUCKET: ${R2_BUCKET_NAME}`);
    console.log(`PREFIX: ${R2_TARGET_PREFIX}`);
    console.log(`======================================================`);

    // --- Confirmation ---
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question('\nType "DELETE" to confirm irreversible action: ');
    rl.close();
    
    if (answer !== 'DELETE') {
        console.log('❌ Deletion cancelled.');
        return;
    }
    // --- End Confirmation ---

    let totalDeleted = 0;
    let cursor;
    let batchCount = 0;

    try {
        do {
            console.log(`\n🔍 Listing objects (Batch ${++batchCount})...`);
            
            // 1. List objects under the prefix
            const listCommand = new ListObjectsV2Command({
                Bucket: R2_BUCKET_NAME,
                Prefix: R2_TARGET_PREFIX,
                MaxKeys: MAX_BATCH_SIZE,
                ContinuationToken: cursor,
            });

            const listResponse = await r2Client.send(listCommand);
            
            const keysToDelete = (listResponse.Contents || []).map(obj => ({ Key: obj.Key }));
            
            if (keysToDelete.length === 0) {
                console.log(`✅ No more objects found.`);
                break; 
            }

            console.log(`🗑️  Found ${keysToDelete.length} objects. Deleting...`);

            // 2. Perform Batch Deletion
            const deleteCommand = new DeleteObjectsCommand({
                Bucket: R2_BUCKET_NAME,
                Delete: {
                    Objects: keysToDelete,
                    Quiet: true,
                },
            });

            const deleteResponse = await r2Client.send(deleteCommand);
            
            const deletedCount = keysToDelete.length - (deleteResponse.Errors?.length || 0);
            totalDeleted += deletedCount;

            if (deleteResponse.Errors?.length) {
                console.error(`❌ Warning: ${deleteResponse.Errors.length} objects failed to delete in this batch.`);
            }

            console.log(`✅ Batch successful. Deleted ${deletedCount} objects. Total deleted: ${totalDeleted}`);

            // 3. Update cursor for the next iteration (pagination)
            cursor = listResponse.NextContinuationToken;

        } while (cursor);

        console.log(`\n🎉 Deletion Complete! A total of ${totalDeleted} objects were removed.`);
        
    } catch (error) {
        console.error('\n❌ CRITICAL FAILURE during R2 operation:', error.message);
        console.log(`Operation stopped after deleting ${totalDeleted} objects.`);
    }
}

deleteR2Path();
