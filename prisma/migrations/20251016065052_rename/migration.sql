/*
  Warnings:

  - You are about to drop the column `drop_off_parson` on the `packages` table. All the data in the column will be lost.
  - You are about to drop the column `pick_up_parson` on the `packages` table. All the data in the column will be lost.
  - Added the required column `drop_off_person` to the `packages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pick_up_person` to the `packages` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "packages" RENAME COLUMN "drop_off_parson" TO "drop_off_person";
ALTER TABLE "packages" RENAME COLUMN "pick_up_parson" TO "pick_up_person";

