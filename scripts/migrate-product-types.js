/**
 * Migration script - NO BUNDLE type
 * Location: scripts/migrate-product-types.js
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  console.log('🔄 Updating product types (BUNDLE removed)');
  
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        slug: true,
        type: true,
        pdfFile: true,
        audioFile: true,
      }
    });

    console.log(`📦 Processing ${products.length} products`);

    let updated = 0;
    
    for (const product of products) {
      const types = [];
      
      // Add types based on actual content
      if (product.pdfFile) {
        types.push('EBOOK');
      }
      
      if (product.audioFile) {
        types.push('AUDIOBOOK');
      }
      
      // Fallback if no files (shouldn't happen)
      if (types.length === 0) {
        console.warn(`  ⚠️  ${product.slug}: No content files found, keeping EBOOK`);
        types.push('EBOOK');
      }
      
      // Check if update needed
      const currentTypes = product.type.filter(t => t !== 'BUNDLE').sort();
      const newTypes = types.sort();
      
      if (JSON.stringify(currentTypes) !== JSON.stringify(newTypes)) {
        console.log(`  ${product.slug}: [${product.type.join(', ')}] → [${newTypes.join(', ')}]`);
        
        await prisma.product.update({
          where: { id: product.id },
          data: { type: newTypes }
        });
        
        updated++;
      }
    }

    console.log(`✅ Updated ${updated} products`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
