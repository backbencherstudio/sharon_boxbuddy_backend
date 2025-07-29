/*
  Warnings:

  - You are about to drop the column `delivery_photo` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `delivery_time_owner_sign` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `delivery_time_traveller_sign` on the `bookings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "delivery_photo",
DROP COLUMN "delivery_time_owner_sign",
DROP COLUMN "delivery_time_traveller_sign",
ADD COLUMN     "drop_off_owner_sign" TEXT,
ADD COLUMN     "drop_off_photo" TEXT,
ADD COLUMN     "drop_off_traveller_sign" TEXT;
