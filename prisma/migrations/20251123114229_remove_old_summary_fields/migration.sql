-- Remove old summary-related columns that are no longer needed
ALTER TABLE "Product" DROP COLUMN IF EXISTS "isSummary";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "originalProductId";
