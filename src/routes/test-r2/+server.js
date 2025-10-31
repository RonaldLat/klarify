import { uploadProductFile } from '$lib/server/services/r2.js';
import { json } from '@sveltejs/kit';

export async function GET() {
	// Test upload
	const testData = Buffer.from('Hello Klarify!', 'utf-8');
	const result = await uploadProductFile(
		testData,
		'test-product-123',
		'sample-pdf',
		'txt'
	);
	
	return json(result);
}
