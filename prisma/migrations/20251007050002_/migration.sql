/*
  Warnings:

  - You are about to drop the `transactions_new` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('STRIPE_PAYMENT', 'WALLET_TOPUP', 'BOOKING_PAYMENT', 'WALLET_REFUND', 'CASHBACK', 'COMMISSION');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- DropTable
DROP TABLE "transactions_new";

-- DropEnum
DROP TYPE "TransactionStatusNew";

-- DropEnum
DROP TYPE "TransactionTypeNew";

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
    "description" TEXT,
    "reference_id" TEXT,
    "user_id" TEXT NOT NULL,
    "wallet_id" TEXT,
    "booking_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transactions_user_id_idx" ON "transactions"("user_id");
