/*
  Warnings:

  - You are about to drop the column `traveller_id` on the `packages` table. All the data in the column will be lost.
  - You are about to drop the `Booking` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Report` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BookingStatus" ADD VALUE 'problem_with_the_package';
ALTER TYPE "BookingStatus" ADD VALUE 'all_conditions_are_not_met';

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_cancel_by_id_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_traveller_id_fkey";

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_reportedById_fkey";

-- DropForeignKey
ALTER TABLE "packages" DROP CONSTRAINT "packages_traveller_id_fkey";

-- AlterTable
ALTER TABLE "packages" DROP COLUMN "traveller_id";

-- DropTable
DROP TABLE "Booking";

-- DropTable
DROP TABLE "Report";

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reported_by_id" TEXT NOT NULL,
    "shot_description" TEXT,
    "details_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'in_progress',
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "amount" DECIMAL(65,30),
    "pick_up_photo" TEXT,
    "pick_up_owner_sign" TEXT,
    "pick_up_traveller_sign" TEXT,
    "delivery_photo" TEXT,
    "delivery_time_owner_sign" TEXT,
    "delivery_time_traveller_sign" TEXT,
    "cancel" BOOLEAN NOT NULL DEFAULT false,
    "cancel_reason" JSONB,
    "cancel_description" TEXT,
    "cancel_by_id" TEXT NOT NULL,
    "cancel_by_who" TEXT,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "problem" BOOLEAN NOT NULL DEFAULT false,
    "problem_reason" JSONB,
    "problem_photo" TEXT,
    "all_conditions" BOOLEAN NOT NULL DEFAULT true,
    "all_conditions_reason" JSONB,
    "traveller_id" TEXT,
    "owner_id" TEXT,
    "package_id" TEXT NOT NULL,
    "travel_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_by_id_fkey" FOREIGN KEY ("reported_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_cancel_by_id_fkey" FOREIGN KEY ("cancel_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_traveller_id_fkey" FOREIGN KEY ("traveller_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_travel_id_fkey" FOREIGN KEY ("travel_id") REFERENCES "travels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
