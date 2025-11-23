/**
 * Remove BUNDLE type from all products
 * Location: scripts/remove-bundle-type.js
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function removeBundleType() {
  console.log('🔄 Removing BUNDLE type from all products...\n');
  
  try {
    // Find all products with BUNDLE type
    const productsWithBundle = await prisma.product.findMany({
      where: {
        type: {
          has: 'BUNDLE'
        }
      },
      select: {
        id: true,
        slug: true,
        type: true,
      }
    });

    console.log(`📦 Found ${productsWithBundle.length} products with BUNDLE type`);

    let updated = 0;
    
    for (const product of productsWithBundle) {
      // Remove BUNDLE from type array
      const newTypes = product.type.filter(t => t !== 'BUNDLE');
      
      console.log(`  ${product.slug}: [${product.type.join(', ')}] → [${newTypes.join(', ')}]`);
      
      await prisma.product.update({
        where: { id: product.id },
        data: { type: newTypes }
      });
      
      updated++;
    }

    console.log(`\n✅ Removed BUNDLE from ${updated} products`);
    
    // Verify
    const remainingBundles = await prisma.product.count({
      where: {
        type: {
          has: 'BUNDLE'
        }
      }
    });
    
    if (remainingBundles === 0) {
      console.log('✅ Success! No BUNDLE types remain.');
    } else {
      console.log(`⚠️  Warning: ${remainingBundles} products still have BUNDLE type`);
    }
    
  } catch (error) {
    console.error('❌ Failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

removeBundleType();
