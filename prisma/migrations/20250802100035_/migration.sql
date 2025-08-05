/*
  Warnings:

  - A unique constraint covering the columns `[user_id]` on the table `Wallet` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Wallet" ALTER COLUMN "user_id" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_user_id_key" ON "Wallet"("user_id");

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
