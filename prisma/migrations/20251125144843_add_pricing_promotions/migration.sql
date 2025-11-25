-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "discountAmount" INTEGER,
ADD COLUMN     "discountPercent" INTEGER,
ADD COLUMN     "discountUntil" TIMESTAMP(3),
ADD COLUMN     "freeUntil" TIMESTAMP(3),
ADD COLUMN     "isFree" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "limitedOffer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "offerText" TEXT;
