-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "order_summary" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "user_payment_methods" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "expMonth" INTEGER,
ADD COLUMN     "expYear" INTEGER,
ADD COLUMN     "is_default" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last4" TEXT;
