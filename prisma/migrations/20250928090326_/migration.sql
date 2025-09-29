-- AlterTable
ALTER TABLE "PaymentMethod" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "checkout_id" TEXT,
ADD COLUMN     "expMonth" INTEGER,
ADD COLUMN     "expYear" INTEGER,
ADD COLUMN     "is_default" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last4" TEXT,
ADD COLUMN     "payment_method_id" TEXT;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "notification_message" TEXT,
ADD COLUMN     "notification_type" TEXT DEFAULT '';
