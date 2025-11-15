/**
 * DEBUG ENDPOINT - List all R2 files for a product
 * Location: src/routes/api/debug/r2-files/[productSlug]/+server.js
 * DELETE THIS FILE AFTER DEBUGGING
 */
import { json } from '@sveltejs/kit';
import { r2Client } from '$lib/server/services/r2.js';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { R2_BUCKET_NAME } from '$env/static/private';

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
  const { productSlug } = params;
  
  try {
    // List all files with different possible prefixes
    const prefixes = [
      `klarify/products/${productSlug}/`,
      `products/${productSlug}/`,
      `${productSlug}/`,
    ];
    
    const results = {};
    
    for (const prefix of prefixes) {
      console.log(`🔍 Checking prefix: ${prefix}`);
      
      const command = new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: prefix,
      });
      
      const response = await r2Client.send(command);
      
      if (response.Contents && response.Contents.length > 0) {
        results[prefix] = response.Contents.map(obj => ({
          key: obj.Key,
          size: obj.Size,
          lastModified: obj.LastModified,
        }));
        console.log(`✅ Found ${response.Contents.length} files with prefix: ${prefix}`);
      } else {
        results[prefix] = [];
        console.log(`❌ No files found with prefix: ${prefix}`);
      }
    }
    
    return json({
      productSlug,
      bucket: R2_BUCKET_NAME,
      results,
    });
    
  } catch (error) {
    console.error('Debug R2 error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
