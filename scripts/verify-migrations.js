import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  console.log('🔍 Verifying migration...\n');
  
  const products = await prisma.product.findMany({
    select: {
      slug: true,
      type: true,
      pdfFile: true,
      audioFile: true,
      audioSummaryFile: true,
    }
  });

  console.log('Product Type Distribution:');
  const typeStats = {};
  
  products.forEach(p => {
    p.type.forEach(t => {
      typeStats[t] = (typeStats[t] || 0) + 1;
    });
  });
  
  Object.entries(typeStats).forEach(([type, count]) => {
    console.log(`  ${type}: ${count} products`);
  });
  
  console.log('\nSample Products:');
  products.slice(0, 5).forEach(p => {
    console.log(`  ${p.slug}:`);
    console.log(`    Types: [${p.type.join(', ')}]`);
    console.log(`    Has PDF: ${!!p.pdfFile}`);
    console.log(`    Has Audio: ${!!p.audioFile}`);
    console.log(`    Has Summary: ${!!p.audioSummaryFile}`);
    console.log('');
  });
  
  await prisma.$disconnect();
}

verify();
