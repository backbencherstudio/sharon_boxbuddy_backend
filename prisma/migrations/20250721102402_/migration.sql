-- DropForeignKey
ALTER TABLE "Package" DROP CONSTRAINT "Package_traveller_id_fkey";

-- AlterTable
ALTER TABLE "Package" ALTER COLUMN "is_electronic" DROP NOT NULL,
ALTER COLUMN "photo" DROP NOT NULL,
ALTER COLUMN "traveller_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_traveller_id_fkey" FOREIGN KEY ("traveller_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
