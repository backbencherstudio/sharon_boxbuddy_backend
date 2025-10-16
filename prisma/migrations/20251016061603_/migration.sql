/*
  Warnings:

  - The `category` column on the `packages` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "packages" ADD COLUMN     "drop_off_person_info" JSONB,
ADD COLUMN     "pick_up_person_info" JSONB,
DROP COLUMN "category",
ADD COLUMN     "category" TEXT[];
