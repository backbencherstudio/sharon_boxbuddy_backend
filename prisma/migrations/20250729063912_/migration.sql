-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('package', 'travel');

-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "package_id" TEXT,
ADD COLUMN     "report_for" "ReportType",
ADD COLUMN     "travel_id" TEXT;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_travel_id_fkey" FOREIGN KEY ("travel_id") REFERENCES "travels"("id") ON DELETE SET NULL ON UPDATE CASCADE;
