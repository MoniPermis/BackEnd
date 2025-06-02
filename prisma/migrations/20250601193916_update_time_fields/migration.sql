-- AlterTable
ALTER TABLE "availability_schedule"
DROP COLUMN "start_time",
ADD COLUMN "start_time" VARCHAR(5) NOT NULL,
DROP COLUMN "end_time",
ADD COLUMN "end_time" VARCHAR(5) NOT NULL;
