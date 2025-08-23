/*
  Warnings:

  - Made the column `creatorEmail` on table `Event` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Event` MODIFY `creatorEmail` VARCHAR(191) NOT NULL,
    MODIFY `imageUrls` TEXT NOT NULL;
