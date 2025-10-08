/*
  Warnings:

  - You are about to drop the column `totalEarnings` on the `platform_wallet` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "platform_wallet" DROP COLUMN "totalEarnings",
ADD COLUMN     "total_earnings" DECIMAL(15,4) NOT NULL DEFAULT 0;
