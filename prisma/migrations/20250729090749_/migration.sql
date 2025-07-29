/*
  Warnings:

  - Added the required column `review_from` to the `reviews` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ReviewForm" AS ENUM ('package_owner', 'traveller');

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "review_from" "ReviewForm" NOT NULL;
