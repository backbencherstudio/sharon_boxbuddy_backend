-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "payment_intent_id" TEXT,
ADD COLUMN     "payment_status" TEXT NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "notification" TEXT,
ADD COLUMN     "show_book_button" BOOLEAN NOT NULL DEFAULT true;
