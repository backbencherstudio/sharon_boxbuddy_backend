/*
  Warnings:

  - The values [cancel_by_sender,cancel_by_traveller] on the enum `BookingStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BookingStatus_new" AS ENUM ('pending', 'in_progress', 'pick_up', 'on_the_way', 'delivered', 'completed', 'rejected', 'cancel', 'problem_with_the_package', 'all_conditions_are_not_met', 'declined', 'expired');
ALTER TABLE "bookings" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "bookings" ALTER COLUMN "status" TYPE "BookingStatus_new" USING ("status"::text::"BookingStatus_new");
ALTER TYPE "BookingStatus" RENAME TO "BookingStatus_old";
ALTER TYPE "BookingStatus_new" RENAME TO "BookingStatus";
DROP TYPE "BookingStatus_old";
ALTER TABLE "bookings" ALTER COLUMN "status" SET DEFAULT 'pending';
COMMIT;

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "cancel_at" TIMESTAMP(3),
ADD COLUMN     "refund_details" JSONB;
