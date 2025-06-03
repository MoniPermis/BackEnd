
-- AlterTable
ALTER TABLE "availability_schedule" DROP COLUMN "day_of_week",
DROP COLUMN "effective_date",
DROP COLUMN "end_time",
DROP COLUMN "start_time",
ADD COLUMN     "end_datetime" DATE NOT NULL,
ADD COLUMN     "recurrence_rule" VARCHAR(255),
ADD COLUMN     "start_datetime" DATE NOT NULL
