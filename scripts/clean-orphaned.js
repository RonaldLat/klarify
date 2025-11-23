/**
 * Clean up orphaned or duplicate products
 * Location: scripts/cleanup-orphaned-products.js
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupOrphaned() {
  console.log('🔍 Finding orphaned products...\n');

  try {
    // Find products with no files (orphaned)
    const orphanedProducts = await prisma.product.findMany({
      where: {
        AND: [
          { pdfFile: null },
          { audioFile: null },
          { audioSummaryFile: null }
        ]
      },
      select: {
        id: true,
        slug: true,
        title: true,
        type: true,
      }
    });

    console.log(`Found ${orphanedProducts.length} orphaned products (no files):`);
    orphanedProducts.forEach(p => {
      console.log(`  - ${p.slug} (${p.type.join(', ')})`);
    });

    if (orphanedProducts.length > 0) {
      const confirm = prompt(`\nDelete ${orphanedProducts.length} orphaned products? (yes/no): `);

      if (confirm === 'yes') {
        for (const product of orphanedProducts) {
          await prisma.product.delete({ where: { id: product.id } });
          console.log(`  ✅ Deleted: ${product.slug}`);
        }
        console.log(`\n✅ Deleted ${orphanedProducts.length} orphaned products`);
      } else {
        console.log('❌ Cleanup cancelled');
      }
    } else {
      console.log('✅ No orphaned products found');
    }

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOrphaned();
