/*
  Warnings:

  - You are about to drop the column `isSummary` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `originalProductId` on the `Product` table. All the data in the column will be lost.
  - Changed the column `type` on the `Product` table from a scalar field to a list field. If there are non-null values in that column, this step will fail.

*/
-- DropForeignKey
-- Step 1: Add new array column
ALTER TABLE "Product" ADD COLUMN "type_array" "ProductType"[];

-- Step 2: Copy existing type values into array
UPDATE "Product" SET "type_array" = ARRAY["type"]::"ProductType"[];

-- Step 3: For products with both PDF and audio, add BUNDLE type
UPDATE "Product" 
SET "type_array" = array_append("type_array", 'BUNDLE'::"ProductType")
WHERE "pdfFile" IS NOT NULL 
  AND "audioFile" IS NOT NULL
  AND "type" IN ('EBOOK', 'AUDIOBOOK');

-- Step 4: Add SUMMARY type if audioSummaryFile would exist (we'll add this field later)
-- This will be done after we add the audioSummaryFile column

-- Step 5: Drop old column and rename new one
ALTER TABLE "Product" DROP COLUMN "type";
ALTER TABLE "Product" RENAME COLUMN "type_array" TO "type";

-- Step 6: Add new fields for summary support
ALTER TABLE "Product" ADD COLUMN "audioSummaryFile" TEXT;
ALTER TABLE "Product" ADD COLUMN "summaryDuration" INTEGER;
ALTER TABLE "Product" ADD COLUMN "summaryPrice" DOUBLE PRECISION;

-- Step 7: Set NOT NULL constraint with default
ALTER TABLE "Product" ALTER COLUMN "type" SET DEFAULT ARRAY['EBOOK']::"ProductType"[];
ALTER TABLE "Product" ALTER COLUMN "type" SET NOT NULL;
