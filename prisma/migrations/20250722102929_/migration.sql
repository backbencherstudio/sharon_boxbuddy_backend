/*
  Warnings:

  - Changed the type of `departure` on the `Travel` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `arrival` on the `Travel` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Travel" DROP COLUMN "departure",
ADD COLUMN     "departure" TIMESTAMP(3) NOT NULL,
DROP COLUMN "arrival",
ADD COLUMN     "arrival" TIMESTAMP(3) NOT NULL;
