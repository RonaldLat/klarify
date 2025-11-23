/**
 * Detect products with audio_summary folders and add SUMMARY type
 * Location: scripts/detect-summaries.js
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function detectSummaries() {
  console.log('🔍 Detecting products with audio summaries...\n');

  try {
    // Get all products
    const products = await prisma.product.findMany({
      select: {
        id: true,
        slug: true,
        type: true,
        r2BasePath: true,
        audioSummaryFile: true,
      }
    });

    console.log(`📦 Checking ${products.length} products for audio_summary folders`);

    let updated = 0;

    for (const product of products) {
      // Check if audioSummaryFile path exists (indicates audio_summary folder)
      // Format: klarify/products/{slug}/audio_summary/
      const hasAudioSummary = product.audioSummaryFile &&
        product.audioSummaryFile.includes('/audio_summary');

      const hasSummaryType = product.type.includes('SUMMARY');

      if (hasAudioSummary && !hasSummaryType) {
        const newTypes = [...product.type, 'SUMMARY'];

        console.log(`  ✅ ${product.slug}: Adding SUMMARY type`);
        console.log(`     Path: ${product.audioSummaryFile}`);
        console.log(`     Types: [${product.type.join(', ')}] → [${newTypes.join(', ')}]`);

        await prisma.product.update({
          where: { id: product.id },
          data: { type: newTypes }
        });

        updated++;
      } else if (hasAudioSummary && hasSummaryType) {
        console.log(`  ⏭️  ${product.slug}: Already has SUMMARY type`);
      }
    }

    console.log(`\n✅ Added SUMMARY type to ${updated} products`);

    // Summary
    const summaryProducts = await prisma.product.findMany({
      where: {
        type: {
          has: 'SUMMARY'
        }
      },
      select: {
        slug: true,
        type: true,
        audioSummaryFile: true,
      }
    });

    console.log(`\n📊 Total products with SUMMARY type: ${summaryProducts.length}`);

    if (summaryProducts.length > 0) {
      console.log('\nProducts with summaries:');
      summaryProducts.forEach(p => {
        console.log(`  - ${p.slug}`);
        console.log(`    Types: [${p.type.join(', ')}]`);
        console.log(`    Path: ${p.audioSummaryFile || 'Not set'}`);
      });
    }

  } catch (error) {
    console.error('❌ Failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

detectSummaries();
