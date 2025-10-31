
// scripts/test-r2.mjs

import 'dotenv/config';
import fs from 'fs';
import { uploadToR2, getDownloadUrl, deleteFromR2, generateFileName } from '../src/lib/server/services/r2.js';

const filePath = './sample.pdf';
const productId = 'cmh8fvqwm0000bv8mp6q0k46i';

async function main() {
  const buffer = fs.readFileSync(filePath);
  const key = generateFileName('sample.pdf', productId);
  console.log('Uploading to key:', key);

  const up = await uploadToR2(buffer, key);
  console.log('Upload result:', up);

  const signed = await getDownloadUrl(key, 3600);
  console.log('Signed URL:', signed);

  // optionally delete:
  // const del = await deleteFromR2(key);
  // console.log('Delete:', del);
}

main().catch(console.error);
