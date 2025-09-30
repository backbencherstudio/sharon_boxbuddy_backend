/*
  Warnings:

  - You are about to alter the column `amount` on the `bookings` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(15,4)`.

*/
-- AlterTable
ALTER TABLE "bookings" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(15,4);
