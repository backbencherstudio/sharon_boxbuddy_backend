/*
  Warnings:

  - You are about to drop the `wallet_transactions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `wallets` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "wallet_transactions" DROP CONSTRAINT "wallet_transactions_wallet_id_fkey";

-- DropTable
DROP TABLE "wallet_transactions";

-- DropTable
DROP TABLE "wallets";

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "stripe_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletConfig" (
    "id" SERIAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "min_deposit" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "min_withdraw" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "platform_account_id" TEXT NOT NULL,
    "central_wallet_id" TEXT NOT NULL,

    CONSTRAINT "WalletConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WalletTransaction_wallet_id_idx" ON "WalletTransaction"("wallet_id");

-- CreateIndex
CREATE INDEX "WalletTransaction_stripe_id_idx" ON "WalletTransaction"("stripe_id");

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
