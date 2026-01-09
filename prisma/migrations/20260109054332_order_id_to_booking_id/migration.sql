/*
  Warnings:

  - You are about to drop the column `order_id` on the `notifications` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "order_id",
ADD COLUMN     "booking_id" TEXT;
