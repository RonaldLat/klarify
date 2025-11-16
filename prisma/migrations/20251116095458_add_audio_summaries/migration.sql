-- AlterEnum
ALTER TYPE "ProductType" ADD VALUE 'SUMMARY';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "isSummary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "keyTakeaways" INTEGER,
ADD COLUMN     "originalProductId" TEXT;

-- CreateIndex
CREATE INDEX "Product_isSummary_idx" ON "Product"("isSummary");

-- CreateIndex
CREATE INDEX "Product_originalProductId_idx" ON "Product"("originalProductId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_originalProductId_fkey" FOREIGN KEY ("originalProductId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
