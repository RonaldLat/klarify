/*
  Warnings:

  - You are about to drop the column `isSummary` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `originalProductId` on the `Product` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Product" DROP CONSTRAINT "Product_originalProductId_fkey";

-- DropIndex
DROP INDEX "public"."Product_isSummary_idx";

-- DropIndex
DROP INDEX "public"."Product_originalProductId_idx";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "isSummary",
DROP COLUMN "originalProductId",
ALTER COLUMN "summaryPrice" SET DEFAULT 69;
