/*
  Warnings:

  - The `recurrence_rule` column on the `availability_schedule` table would be dropped and recreated. This will lead to data loss if there is data in the column.
*/
-- CreateEnum
CREATE TYPE "RuleType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- AlterTable
ALTER TABLE "availability_schedule"
ALTER COLUMN "end_datetime" SET DATA TYPE TIMESTAMP(3),
DROP COLUMN "recurrence_rule",
ADD COLUMN     "recurrence_rule" "RuleType",
ALTER COLUMN "start_datetime" SET DATA TYPE TIMESTAMP(3);
