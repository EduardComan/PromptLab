/*
  Warnings:

  - You are about to drop the column `title` on the `merge_requests` table. All the data in the column will be lost.
  - Made the column `description` on table `merge_requests` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "merge_requests" DROP COLUMN "title",
ALTER COLUMN "description" SET NOT NULL;
