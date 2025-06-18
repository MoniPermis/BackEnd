
-- AlterTable
ALTER TABLE "meeting_point" DROP COLUMN "location",
ADD COLUMN     "latitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "longitude" DOUBLE PRECISION NOT NULL;

