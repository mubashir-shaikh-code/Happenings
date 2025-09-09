/*
  Warnings:

  - You are about to drop the column `adminViewed` on the `EventRequest` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `EventRequest` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(2))`.

*/
-- DropForeignKey
ALTER TABLE `EventRequest` DROP FOREIGN KEY `EventRequest_eventId_fkey`;

-- AlterTable
ALTER TABLE `EventRequest` DROP COLUMN `adminViewed`,
    MODIFY `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING';

-- AddForeignKey
ALTER TABLE `EventRequest` ADD CONSTRAINT `EventRequest_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
