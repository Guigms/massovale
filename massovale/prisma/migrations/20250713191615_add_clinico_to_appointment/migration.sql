/*
  Warnings:

  - Added the required column `clinicoId` to the `Appointment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Appointment` ADD COLUMN `clinicoId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Appointment` ADD CONSTRAINT `Appointment_clinicoId_fkey` FOREIGN KEY (`clinicoId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
