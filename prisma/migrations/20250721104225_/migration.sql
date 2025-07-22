/*
  Warnings:

  - Changed the type of `pick_up_parson` on the `Package` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `drop_off_parson` to the `Package` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Package" DROP COLUMN "pick_up_parson",
ADD COLUMN     "pick_up_parson" TEXT NOT NULL,
DROP COLUMN "drop_off_parson",
ADD COLUMN     "drop_off_parson" TEXT NOT NULL;

-- DropEnum
DROP TYPE "DropOffPerson";

-- DropEnum
DROP TYPE "PickUpPerson";
