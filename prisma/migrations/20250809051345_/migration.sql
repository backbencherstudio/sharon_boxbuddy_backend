/*
  Warnings:

  - You are about to drop the column `attachment_id` on the `messages` table. All the data in the column will be lost.
  - Added the required column `message_id` to the `attachments` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_attachment_id_fkey";

-- AlterTable
ALTER TABLE "attachments" ADD COLUMN     "message_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "attachment_id";

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
