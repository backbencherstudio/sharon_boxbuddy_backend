/*
  Warnings:

  - You are about to drop the `Wallet` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WalletConfig` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WalletTransaction` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Wallet" DROP CONSTRAINT "Wallet_user_id_fkey";

-- DropForeignKey
ALTER TABLE "WalletTransaction" DROP CONSTRAINT "WalletTransaction_wallet_id_fkey";

-- DropTable
DROP TABLE "Wallet";

-- DropTable
DROP TABLE "WalletConfig";

-- DropTable
DROP TABLE "WalletTransaction";

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "stripe_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_configs" (
    "id" SERIAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "min_deposit" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "min_withdraw" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "platform_account_id" TEXT NOT NULL,
    "central_wallet_id" TEXT NOT NULL,

    CONSTRAINT "wallet_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wallets_user_id_key" ON "wallets"("user_id");

-- CreateIndex
CREATE INDEX "wallets_user_id_idx" ON "wallets"("user_id");

-- CreateIndex
CREATE INDEX "wallet_transactions_wallet_id_idx" ON "wallet_transactions"("wallet_id");

-- CreateIndex
CREATE INDEX "wallet_transactions_stripe_id_idx" ON "wallet_transactions"("stripe_id");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_configs_currency_key" ON "wallet_configs"("currency");

-- CreateIndex
CREATE UNIQUE INDEX "payment_accounts_user_id_provider_account_id_key" ON "payment_accounts"("user_id", "provider", "account_id");

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_accounts" ADD CONSTRAINT "payment_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
