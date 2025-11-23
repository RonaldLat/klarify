import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSchema() {
  try {
    // Try to query with new schema
    const sample = await prisma.product.findFirst({
      select: {
        id: true,
        slug: true,
        type: true,
        audioSummaryFile: true,
        summaryDuration: true,
        summaryPrice: true,
      }
    });
    
    console.log('✅ Schema appears correct!');
    console.log('Sample product:', sample);
    console.log('Type is array:', Array.isArray(sample?.type));
    
  } catch (error) {
    console.error('❌ Schema issue:', error.message);
    
    if (error.message.includes('audioSummaryFile')) {
      console.log('\n🔧 Need to add: audioSummaryFile, summaryDuration, summaryPrice');
    }
    if (error.message.includes('type')) {
      console.log('\n🔧 Need to convert: type column to array');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();
