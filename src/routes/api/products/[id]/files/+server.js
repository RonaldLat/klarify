/**
 * @fileoverview Update product with uploaded file paths
 * Location: src/routes/api/products/[id]/files/+server.js
 */

import { json, error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma.js';

/** @type {import('./$types').RequestHandler} */
export async function PATCH({ request, params, locals }) {
  // Check admin auth
  if (!locals.user || locals.user.role !== 'admin') {
    throw error(401, 'Unauthorized');
  }

  try {
    const { files } = await request.json();
    const productId = params.id;

    if (!files || !productId) {
      throw error(400, 'Missing required data');
    }

    // Update product with file paths
    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        coverImage: files.cover || '',
        pdfFile: files.pdf || null,
        audioFile: files.audio || null,
        samplePdf: files['sample-pdf'] || null,
        sampleAudio: files['sample-audio'] || null,
      },
    });

    console.log('✅ Product files updated:', productId);

    return json({
      success: true,
      product
    });

  } catch (err) {
    console.error('❌ Update files error:', err);
    
    if (err.status) {
      throw err;
    }
    
    throw error(500, err.message || 'Failed to update product files');
  }
}
