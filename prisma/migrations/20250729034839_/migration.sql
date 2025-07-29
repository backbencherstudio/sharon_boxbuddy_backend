/*
  Warnings:

  - You are about to drop the column `all_conditions_are_met` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `all_conditions_reason` on the `bookings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "all_conditions_are_met",
DROP COLUMN "all_conditions_reason",
ADD COLUMN     "all_conditions_are_not_met" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "all_conditions_are_not_met_reason" JSONB;
