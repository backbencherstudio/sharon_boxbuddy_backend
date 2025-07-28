-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_cancel_by_id_fkey";

-- AlterTable
ALTER TABLE "bookings" ALTER COLUMN "cancel_by_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_cancel_by_id_fkey" FOREIGN KEY ("cancel_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
