-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'NOTATION', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RuleType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateTable
CREATE TABLE "instructor" (
    "id" SERIAL NOT NULL,
    "price_id" INTEGER NOT NULL,
    "first_name" VARCHAR(255) NOT NULL,
    "last_name" VARCHAR(255) NOT NULL,
    "gender" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone_number" VARCHAR(255),
    "address" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "siret" VARCHAR(255) NOT NULL,
    "driver_licence_url" VARCHAR(255) NOT NULL,
    "registration_certificate_url" VARCHAR(255) NOT NULL,
    "insurance_certificate_url" VARCHAR(255) NOT NULL,
    "degree_url" VARCHAR(255) NOT NULL,
    "teaching_authorization_url" VARCHAR(255) NOT NULL,
    "profile_picture_url" VARCHAR(255),
    "created_at" DATE NOT NULL,
    "updated_at" DATE NOT NULL,
    "IBAN" VARCHAR(255) NOT NULL,
    "BIC" VARCHAR(255) NOT NULL,

    CONSTRAINT "instructor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student" (
    "id" SERIAL NOT NULL,
    "first_name" VARCHAR(255) NOT NULL,
    "last_name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "phone_number" VARCHAR(255),
    "NEPH" INTEGER,
    "credit_card_id" INTEGER,
    "profile_picture_url" VARCHAR(255),
    "created_at" DATE NOT NULL,
    "updated_at" DATE NOT NULL,

    CONSTRAINT "student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tchat" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "student_id" INTEGER NOT NULL,
    "instructor_id" INTEGER NOT NULL,
    "created_at" DATE NOT NULL,
    "last_message_at" DATE NOT NULL,

    CONSTRAINT "tchat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message" (
    "id" SERIAL NOT NULL,
    "content" VARCHAR(255) NOT NULL,
    "sender_type" VARCHAR(255) NOT NULL,
    "tchat_id" INTEGER NOT NULL,
    "is_read" BOOLEAN NOT NULL,
    "sent_at" DATE NOT NULL,

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_card" (
    "id" SERIAL NOT NULL,
    "card_number" INTEGER NOT NULL,
    "expiration_date" DATE NOT NULL,
    "CVV" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "credit_card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "instructor_id" INTEGER NOT NULL,
    "meeting_point_id" INTEGER NOT NULL,
    "payment_id" INTEGER,
    "start_time" DATE NOT NULL,
    "end_time" DATE NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "description" VARCHAR(255),
    "created_at" DATE NOT NULL,
    "modified_at" DATE NOT NULL,

    CONSTRAINT "appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_point" (
    "id" SERIAL NOT NULL,
    "instructor_id" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" DATE NOT NULL,
    "modified_at" DATE NOT NULL,

    CONSTRAINT "meeting_point_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_schedule" (
    "id" SERIAL NOT NULL,
    "instructor_id" INTEGER NOT NULL,
    "start_datetime" TIMESTAMP(3) NOT NULL,
    "end_datetime" TIMESTAMP(3) NOT NULL,
    "is_recurring" BOOLEAN NOT NULL,
    "recurrence_rule" "RuleType",
    "expiry_date" DATE,
    "note" VARCHAR(255),

    CONSTRAINT "availability_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructor_unavailability" (
    "id" SERIAL NOT NULL,
    "instructor_id" INTEGER NOT NULL,
    "start_datetime" TIMESTAMP(3) NOT NULL,
    "end_datetime" TIMESTAMP(3) NOT NULL,
    "reason" VARCHAR(255) NOT NULL,

    CONSTRAINT "instructor_unavailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructor_review" (
    "id" SERIAL NOT NULL,
    "instructor_id" INTEGER NOT NULL,
    "stars_grade" INTEGER NOT NULL DEFAULT 5,
    "comment" VARCHAR(255) NOT NULL,
    "created_at" DATE NOT NULL,

    CONSTRAINT "instructor_review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "price_id" INTEGER NOT NULL,
    "datetime" DATE NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price" (
    "id" SERIAL NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" VARCHAR(255) NOT NULL,

    CONSTRAINT "price_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order" (
    "id" SERIAL NOT NULL,
    "instructor_id" INTEGER NOT NULL,
    "payment_id" INTEGER NOT NULL,
    "unique_number" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "issue_date" DATE NOT NULL,
    "expiration_date" DATE NOT NULL,
    "delivery_name" VARCHAR(255) NOT NULL,
    "delivery_type" VARCHAR(255) NOT NULL,
    "delivery_description" VARCHAR(255) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price_duty_free" INTEGER NOT NULL,
    "VAT" INTEGER NOT NULL,
    "total_price_duty_free" INTEGER NOT NULL,
    "final_total_price_duty_free" INTEGER NOT NULL,
    "final_VAT" INTEGER NOT NULL,
    "final_total_price" INTEGER NOT NULL,
    "signature_date" DATE NOT NULL,
    "signature_place" VARCHAR(255) NOT NULL,
    "signature" VARCHAR(255) NOT NULL,
    "VAT_number" BIGINT NOT NULL,
    "created_at" DATE NOT NULL,

    CONSTRAINT "purchase_order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "instructor_email_key" ON "instructor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "instructor_siret_key" ON "instructor"("siret");

-- CreateIndex
CREATE UNIQUE INDEX "instructor_IBAN_key" ON "instructor"("IBAN");

-- CreateIndex
CREATE UNIQUE INDEX "student_email_key" ON "student"("email");

-- CreateIndex
CREATE UNIQUE INDEX "credit_card_card_number_key" ON "credit_card"("card_number");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_order_unique_number_key" ON "purchase_order"("unique_number");

-- AddForeignKey
ALTER TABLE "instructor" ADD CONSTRAINT "instructor_price_id_fkey" FOREIGN KEY ("price_id") REFERENCES "price"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student" ADD CONSTRAINT "student_credit_card_id_fkey" FOREIGN KEY ("credit_card_id") REFERENCES "credit_card"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tchat" ADD CONSTRAINT "tchat_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tchat" ADD CONSTRAINT "tchat_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_tchat_id_fkey" FOREIGN KEY ("tchat_id") REFERENCES "tchat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_meeting_point_id_fkey" FOREIGN KEY ("meeting_point_id") REFERENCES "meeting_point"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_point" ADD CONSTRAINT "meeting_point_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_schedule" ADD CONSTRAINT "availability_schedule_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_unavailability" ADD CONSTRAINT "instructor_unavailability_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_review" ADD CONSTRAINT "instructor_review_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_price_id_fkey" FOREIGN KEY ("price_id") REFERENCES "price"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

