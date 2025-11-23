/**
 * Clean up orphaned files in R2 that don't have matching database records
 * Location: scripts/cleanup-r2-orphans.js
 */
import { PrismaClient } from '@prisma/client';
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import 'dotenv/config';

const prisma = new PrismaClient();

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

async function cleanupOrphanedR2Files() {
  console.log('🔍 Finding orphaned R2 files...\n');
  
  try {
    // Get all products with their R2 base paths
    const products = await prisma.product.findMany({
      select: {
        slug: true,
        r2BasePath: true,
      }
    });
    
    const validPrefixes = new Set(products.map(p => p.r2BasePath + '/'));
    console.log(`✅ Found ${products.length} products in database`);
    
    // List all folders in R2
    const listCommand = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: 'products/',
      Delimiter: '/'
    });
    
    const response = await r2Client.send(listCommand);
    const r2Prefixes = response.CommonPrefixes || [];
    
    console.log(`📦 Found ${r2Prefixes.length} product folders in R2\n`);
    
    // Find orphaned folders
    const orphanedFolders = [];
    for (const prefix of r2Prefixes) {
      if (!validPrefixes.has(prefix.Prefix)) {
        orphanedFolders.push(prefix.Prefix);
      }
    }
    
    if (orphanedFolders.length === 0) {
      console.log('✅ No orphaned folders found!');
      return;
    }
    
    console.log(`⚠️  Found ${orphanedFolders.length} orphaned folders:`);
    orphanedFolders.forEach(folder => console.log(`  - ${folder}`));
    
    // Confirm deletion
    console.log(`\n🗑️  This will delete ALL files in these ${orphanedFolders.length} folders`);
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      rl.question('\nType "DELETE" to confirm: ', resolve);
    });
    rl.close();
    
    if (answer !== 'DELETE') {
      console.log('❌ Cleanup cancelled');
      return;
    }
    
    // Delete orphaned folders
    let totalDeleted = 0;
    for (const folder of orphanedFolders) {
      console.log(`\n🗑️  Deleting ${folder}...`);
      
      // List all objects in folder
      const listObjects = new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: folder
      });
      
      const objects = await r2Client.send(listObjects);
      
      if (objects.Contents) {
        for (const obj of objects.Contents) {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: obj.Key
          });
          await r2Client.send(deleteCommand);
          totalDeleted++;
        }
        console.log(`  ✅ Deleted ${objects.Contents.length} files`);
      }
    }
    
    console.log(`\n✅ Cleanup complete! Deleted ${totalDeleted} files from ${orphanedFolders.length} folders`);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOrphanedR2Files();
