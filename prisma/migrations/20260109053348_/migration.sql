-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "conversation_id" TEXT,
ADD COLUMN     "order_id" TEXT,
ADD COLUMN     "owner_id" TEXT,
ADD COLUMN     "traveller_id" TEXT;
