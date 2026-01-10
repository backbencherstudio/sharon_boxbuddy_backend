/*
  Warnings:

  - A unique constraint covering the columns `[booking_id]` on the table `announcement_requests` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "announcement_requests_booking_id_key" ON "announcement_requests"("booking_id");
