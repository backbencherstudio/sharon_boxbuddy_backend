/*
  Warnings:

  - You are about to drop the `Package` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Travel` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Package" DROP CONSTRAINT "Package_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "Package" DROP CONSTRAINT "Package_traveller_id_fkey";

-- DropForeignKey
ALTER TABLE "Travel" DROP CONSTRAINT "Travel_user_id_fkey";

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "package_id" TEXT,
ADD COLUMN     "travel_id" TEXT;

-- DropTable
DROP TABLE "Package";

-- DropTable
DROP TABLE "Travel";

-- CreateTable
CREATE TABLE "packages" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "weight" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "length" TEXT,
    "depth" TEXT,
    "width" TEXT,
    "is_electronic" BOOLEAN DEFAULT false,
    "photo" TEXT,
    "pick_up_location" TEXT NOT NULL,
    "pick_up_parson" TEXT NOT NULL,
    "drop_off_location" TEXT NOT NULL,
    "drop_off_parson" TEXT NOT NULL,
    "publish" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT DEFAULT 'new',
    "traveller_id" TEXT,
    "owner_id" TEXT NOT NULL,

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "travels" (
    "id" TEXT NOT NULL,
    "flight_number" TEXT NOT NULL,
    "airline" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "departure" TIMESTAMP(3) NOT NULL,
    "collect_radius" TEXT NOT NULL,
    "arrival" TIMESTAMP(3) NOT NULL,
    "drop_radius" TEXT NOT NULL,
    "number_of_checked_bags" JSONB NOT NULL,
    "number_of_cabin_bags" JSONB NOT NULL,
    "accept_electronic_items" BOOLEAN NOT NULL,
    "trip_details" TEXT NOT NULL,
    "publish" BOOLEAN NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "travels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_requests" (
    "id" TEXT NOT NULL,
    "package_id" TEXT NOT NULL,
    "travel_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcement_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_travel_id_fkey" FOREIGN KEY ("travel_id") REFERENCES "travels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_traveller_id_fkey" FOREIGN KEY ("traveller_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travels" ADD CONSTRAINT "travels_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_requests" ADD CONSTRAINT "announcement_requests_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_requests" ADD CONSTRAINT "announcement_requests_travel_id_fkey" FOREIGN KEY ("travel_id") REFERENCES "travels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
