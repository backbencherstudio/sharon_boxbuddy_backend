/*
  Warnings:

  - A unique constraint covering the columns `[travel_id,package_id]` on the table `conversations` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "conversations_travel_id_package_id_idx" ON "conversations"("travel_id", "package_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_travel_id_package_id_key" ON "conversations"("travel_id", "package_id");
