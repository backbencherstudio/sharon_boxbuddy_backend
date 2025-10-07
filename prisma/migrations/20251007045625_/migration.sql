/*
  Warnings:

  - You are about to drop the `wallet_transactions` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TransactionTypeNew" AS ENUM ('STRIPE_PAYMENT', 'WALLET_TOPUP', 'BOOKING_PAYMENT', 'WALLET_REFUND', 'CASHBACK', 'COMMISSION');

-- CreateEnum
CREATE TYPE "TransactionStatusNew" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- DropForeignKey
ALTER TABLE "wallet_transactions" DROP CONSTRAINT "wallet_transactions_wallet_id_fkey";

-- DropTable
DROP TABLE "wallet_transactions";

-- DropEnum
DROP TYPE "TransactionStatus";

-- DropEnum
DROP TYPE "TransactionType";

-- CreateTable
CREATE TABLE "transactions_new" (
    "id" TEXT NOT NULL,
    "type" "TransactionTypeNew" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "TransactionStatusNew" NOT NULL DEFAULT 'COMPLETED',
    "description" TEXT,
    "reference_id" TEXT,
    "user_id" TEXT NOT NULL,
    "wallet_id" TEXT,
    "booking_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_new_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transactions_new_user_id_idx" ON "transactions_new"("user_id");
