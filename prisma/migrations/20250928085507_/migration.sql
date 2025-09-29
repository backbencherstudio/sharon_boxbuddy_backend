/*
  Warnings:

  - You are about to drop the column `notification_type` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `notification` on the `conversations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "notification_type";

-- AlterTable
ALTER TABLE "conversations" DROP COLUMN "notification",
ADD COLUMN     "notification_type" TEXT DEFAULT '';
