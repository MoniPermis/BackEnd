-- DropForeignKey
ALTER TABLE "appointment" DROP CONSTRAINT "appointment_instructor_id_fkey";

-- DropForeignKey
ALTER TABLE "appointment" DROP CONSTRAINT "appointment_student_id_fkey";

-- DropForeignKey
ALTER TABLE "availability_schedule" DROP CONSTRAINT "availability_schedule_instructor_id_fkey";

-- DropForeignKey
ALTER TABLE "instructor_review" DROP CONSTRAINT "instructor_review_instructor_id_fkey";

-- DropForeignKey
ALTER TABLE "instructor_unavailability" DROP CONSTRAINT "instructor_unavailability_instructor_id_fkey";

-- DropForeignKey
ALTER TABLE "meeting_point" DROP CONSTRAINT "meeting_point_instructor_id_fkey";

-- DropForeignKey
ALTER TABLE "message" DROP CONSTRAINT "message_tchat_id_fkey";

-- DropForeignKey
ALTER TABLE "purchase_order" DROP CONSTRAINT "purchase_order_instructor_id_fkey";

-- DropForeignKey
ALTER TABLE "tchat" DROP CONSTRAINT "tchat_instructor_id_fkey";

-- DropForeignKey
ALTER TABLE "tchat" DROP CONSTRAINT "tchat_student_id_fkey";

-- AlterTable
ALTER TABLE "purchase_order" ADD COLUMN     "deleted_instructor_id" INTEGER,
ALTER COLUMN "instructor_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "deleted_instructor" (
    "id" SERIAL NOT NULL,
    "original_instructor_id" INTEGER NOT NULL,
    "first_name" VARCHAR(255) NOT NULL,
    "last_name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "siret" VARCHAR(255) NOT NULL,
    "IBAN" VARCHAR(255) NOT NULL,
    "deleted_at" DATE NOT NULL,

    CONSTRAINT "deleted_instructor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deleted_instructor_original_instructor_id_key" ON "deleted_instructor"("original_instructor_id");

-- AddForeignKey
ALTER TABLE "tchat" ADD CONSTRAINT "tchat_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tchat" ADD CONSTRAINT "tchat_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_tchat_id_fkey" FOREIGN KEY ("tchat_id") REFERENCES "tchat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_point" ADD CONSTRAINT "meeting_point_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_schedule" ADD CONSTRAINT "availability_schedule_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_unavailability" ADD CONSTRAINT "instructor_unavailability_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_review" ADD CONSTRAINT "instructor_review_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_deleted_instructor_id_fkey" FOREIGN KEY ("deleted_instructor_id") REFERENCES "deleted_instructor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
