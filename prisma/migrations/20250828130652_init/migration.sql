-- -- CreateTable
-- CREATE TABLE `User` (
--     `id` VARCHAR(191) NOT NULL,
--     `clerkId` VARCHAR(191) NOT NULL,
--     `fullName` VARCHAR(191) NOT NULL,
--     `email` VARCHAR(191) NOT NULL,
--     `role` ENUM('VIEWER', 'CREATOR', 'ADMIN') NOT NULL DEFAULT 'VIEWER',
--     `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
--     `lastSignedIn` DATETIME(3) NULL,

--     UNIQUE INDEX `User_clerkId_key`(`clerkId`),
--     UNIQUE INDEX `User_email_key`(`email`),
--     PRIMARY KEY (`id`)
-- ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- -- CreateTable
-- CREATE TABLE `Event` (
--     `id` VARCHAR(191) NOT NULL,
--     `creatorId` VARCHAR(191) NOT NULL,
--     `creatorEmail` VARCHAR(191) NOT NULL,
--     `organizer` VARCHAR(191) NOT NULL,
--     `title` VARCHAR(191) NOT NULL,
--     `description` VARCHAR(191) NOT NULL,
--     `category` ENUM('ANYTHING', 'WEEKENDS', 'DINING', 'SHOPPING', 'STAY', 'TECH') NOT NULL,
--     `tags` TEXT NOT NULL,
--     `venue` VARCHAR(191) NOT NULL,
--     `startDateTime` DATETIME(3) NOT NULL,
--     `endDateTime` DATETIME(3) NOT NULL,
--     `imageUrls` TEXT NOT NULL,
--     `ticketLink` VARCHAR(191) NOT NULL,
--     `adminApproved` BOOLEAN NOT NULL DEFAULT false,

--     PRIMARY KEY (`id`)
-- ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- -- CreateTable
-- CREATE TABLE `EventRequest` (
--     `id` VARCHAR(191) NOT NULL,
--     `eventId` VARCHAR(191) NOT NULL,
--     `requestedById` VARCHAR(191) NOT NULL,
--     `requestedByEmail` VARCHAR(191) NOT NULL,
--     `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
--     `adminViewed` BOOLEAN NOT NULL DEFAULT false,
--     `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

--     UNIQUE INDEX `EventRequest_eventId_key`(`eventId`),
--     PRIMARY KEY (`id`)
-- ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- -- AddForeignKey
-- ALTER TABLE `Event` ADD CONSTRAINT `Event_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- -- AddForeignKey
-- ALTER TABLE `EventRequest` ADD CONSTRAINT `EventRequest_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- -- AddForeignKey
-- ALTER TABLE `EventRequest` ADD CONSTRAINT `EventRequest_requestedById_fkey` FOREIGN KEY (`requestedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
