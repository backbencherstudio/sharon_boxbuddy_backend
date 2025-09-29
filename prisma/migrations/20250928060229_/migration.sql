/*
  Warnings:

  - You are about to drop the column `brand` on the `PaymentMethod` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `PaymentMethod` table. All the data in the column will be lost.
  - You are about to drop the column `expMonth` on the `PaymentMethod` table. All the data in the column will be lost.
  - You are about to drop the column `expYear` on the `PaymentMethod` table. All the data in the column will be lost.
  - You are about to drop the column `isDefault` on the `PaymentMethod` table. All the data in the column will be lost.
  - You are about to drop the column `last4` on the `PaymentMethod` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PaymentMethod" DROP COLUMN "brand",
DROP COLUMN "createdAt",
DROP COLUMN "expMonth",
DROP COLUMN "expYear",
DROP COLUMN "isDefault",
DROP COLUMN "last4";

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "notification_type" TEXT DEFAULT '';
