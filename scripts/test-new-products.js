// test-free-products.js
// Run this to check if you have free products in your database
// Usage: node test-free-products.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testFreeProducts() {
  console.log('\n🔍 Checking for free products in database...\n');
  
  const now = new Date();
  
  // Check all products with isFree = true
  const allFreeProducts = await prisma.product.findMany({
    where: {
      isFree: true
    },
    select: {
      id: true,
      title: true,
      isFree: true,
      freeUntil: true,
      active: true,
    }
  });
  
  console.log(`Total products with isFree=true: ${allFreeProducts.length}`);
  
  if (allFreeProducts.length === 0) {
    console.log('\n❌ No products have isFree=true');
    console.log('\n💡 To fix this, update your CSV with:');
    console.log('   Is Free,Free Until');
    console.log('   TRUE,2025-12-31');
    console.log('\nOr run this SQL:');
    console.log(`   UPDATE "Product" SET "isFree" = true WHERE slug = 'your-slug';`);
    await prisma.$disconnect();
    return;
  }
  
  console.log('\nAll free products:');
  allFreeProducts.forEach(p => {
    console.log(`  - ${p.title}`);
    console.log(`    Active: ${p.active}`);
    console.log(`    Free Until: ${p.freeUntil || 'Forever'}`);
    console.log('');
  });
  
  // Check ACTIVE free products
  const activeFreeProducts = await prisma.product.findMany({
    where: {
      active: true,
      isFree: true,
      OR: [
        { freeUntil: null },
        { freeUntil: { gte: now } }
      ]
    },
    select: {
      title: true,
      slug: true,
    }
  });
  
  console.log(`\n✅ Active free products (will show on homepage): ${activeFreeProducts.length}`);
  
  if (activeFreeProducts.length === 0) {
    console.log('\n⚠️  You have free products, but none are currently active or valid!');
    console.log('\nPossible issues:');
    console.log('  1. Products have active=false');
    console.log('  2. freeUntil date has passed');
    
    const inactiveCount = allFreeProducts.filter(p => !p.active).length;
    const expiredCount = allFreeProducts.filter(p => 
      p.active && p.freeUntil && new Date(p.freeUntil) < now
    ).length;
    
    if (inactiveCount > 0) {
      console.log(`\n  ${inactiveCount} products are inactive (active=false)`);
    }
    if (expiredCount > 0) {
      console.log(`  ${expiredCount} products have expired freeUntil dates`);
    }
  } else {
    console.log('\nThese products will appear in the free section:');
    activeFreeProducts.forEach(p => {
      console.log(`  ✓ ${p.title} (${p.slug})`);
    });
  }
  
  // Check discounted products
  const discountedProducts = await prisma.product.findMany({
    where: {
      active: true,
      isFree: false,
      OR: [
        {
          AND: [
            { discountPercent: { gt: 0 } },
            {
              OR: [
                { discountUntil: null },
                { discountUntil: { gte: now } }
              ]
            }
          ]
        },
        {
          AND: [
            { discountAmount: { gt: 0 } },
            {
              OR: [
                { discountUntil: null },
                { discountUntil: { gte: now } }
              ]
            }
          ]
        },
        {
          AND: [
            { limitedOffer: true },
            {
              OR: [
                { discountUntil: null },
                { discountUntil: { gte: now } }
              ]
            }
          ]
        }
      ]
    },
    select: {
      title: true,
      discountPercent: true,
      discountAmount: true,
    }
  });
  
  console.log(`\n💰 Active discounted products: ${discountedProducts.length}`);
  if (discountedProducts.length > 0) {
    discountedProducts.slice(0, 5).forEach(p => {
      const discount = p.discountPercent 
        ? `${p.discountPercent}% off`
        : `KSh ${p.discountAmount} off`;
      console.log(`  • ${p.title} - ${discount}`);
    });
  }
  
  console.log(`\n📊 Total promotional products: ${activeFreeProducts.length + discountedProducts.length}`);
  console.log('\n✅ Test complete!\n');
  
  await prisma.$disconnect();
}

testFreeProducts().catch(console.error);
