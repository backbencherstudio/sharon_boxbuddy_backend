-- AlterTable
ALTER TABLE "users" ADD COLUMN     "total_booking_canceled" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_booking_completed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_orders" INTEGER NOT NULL DEFAULT 0;
