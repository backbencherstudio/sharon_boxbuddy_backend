/*
  Warnings:

  - You are about to drop the column `all_conditions` on the `bookings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "all_conditions",
ADD COLUMN     "all_conditions_are_met" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "status" SET DEFAULT 'pick_up';
