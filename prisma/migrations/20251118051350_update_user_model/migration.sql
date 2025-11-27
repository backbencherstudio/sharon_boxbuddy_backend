/*
  Warnings:

  - You are about to drop the column `blocked_at` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "blocked_at",
ADD COLUMN     "is_blocked" BOOLEAN NOT NULL DEFAULT false;
