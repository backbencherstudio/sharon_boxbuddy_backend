/*
  Warnings:

  - You are about to drop the column `arrival_radius` on the `Travel` table. All the data in the column will be lost.
  - You are about to drop the column `departure_radius` on the `Travel` table. All the data in the column will be lost.
  - Added the required column `collect_radius` to the `Travel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `drop_radius` to the `Travel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Travel" DROP COLUMN "arrival_radius",
DROP COLUMN "departure_radius",
ADD COLUMN     "collect_radius" TEXT NOT NULL,
ADD COLUMN     "drop_radius" TEXT NOT NULL;
