/*
  Warnings:

  - You are about to drop the column `availabilityId` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the `Availability` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[clinicoId,date]` on the table `Appointment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `date` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patientId` to the `Appointment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Appointment` DROP FOREIGN KEY `Appointment_availabilityId_fkey`;

-- DropForeignKey
ALTER TABLE `Appointment` DROP FOREIGN KEY `Appointment_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Availability` DROP FOREIGN KEY `Availability_userId_fkey`;

-- DropIndex
DROP INDEX `Appointment_availabilityId_key` ON `Appointment`;

-- DropIndex
DROP INDEX `Appointment_userId_fkey` ON `Appointment`;

-- AlterTable
ALTER TABLE `Appointment` DROP COLUMN `availabilityId`,
    DROP COLUMN `userId`,
    ADD COLUMN `date` DATETIME(3) NOT NULL,
    ADD COLUMN `patientId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `avatarUrl` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `Availability`;

-- CreateTable
CREATE TABLE `BlockedSlot` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATETIME(3) NOT NULL,
    `clinicoId` INTEGER NOT NULL,

    UNIQUE INDEX `BlockedSlot_clinicoId_date_key`(`clinicoId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Appointment_clinicoId_date_key` ON `Appointment`(`clinicoId`, `date`);

-- AddForeignKey
ALTER TABLE `BlockedSlot` ADD CONSTRAINT `BlockedSlot_clinicoId_fkey` FOREIGN KEY (`clinicoId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Appointment` ADD CONSTRAINT `Appointment_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
