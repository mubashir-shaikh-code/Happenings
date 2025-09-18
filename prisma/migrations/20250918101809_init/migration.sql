/*
  Warnings:

  - The values [APPROVED] on the enum `EventRequest_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
-- ALTER TABLE `eventrequest` MODIFY `status` ENUM('PENDING', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'PENDING';
