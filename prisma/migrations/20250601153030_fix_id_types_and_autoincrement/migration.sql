-- Migration pour changer BIGINT vers INT avec autoincrement
-- ATTENTION : Cette migration peut être complexe à cause des foreign keys

-- Étape 1: Supprimer toutes les foreign keys
ALTER TABLE "instructor" DROP CONSTRAINT "instructor_price_id_fkey";
ALTER TABLE "student" DROP CONSTRAINT "student_credit_card_id_fkey";
ALTER TABLE "tchat" DROP CONSTRAINT "tchat_student_id_fkey";
ALTER TABLE "tchat" DROP CONSTRAINT "tchat_instructor_id_fkey";
ALTER TABLE "message" DROP CONSTRAINT "message_tchat_id_fkey";
ALTER TABLE "appointment" DROP CONSTRAINT "appointment_student_id_fkey";
ALTER TABLE "appointment" DROP CONSTRAINT "appointment_instructor_id_fkey";
ALTER TABLE "appointment" DROP CONSTRAINT "appointment_meeting_point_id_fkey";
ALTER TABLE "appointment" DROP CONSTRAINT "appointment_payment_id_fkey";
ALTER TABLE "meeting_point" DROP CONSTRAINT "meeting_point_instructor_id_fkey";
ALTER TABLE "availability_schedule" DROP CONSTRAINT "availability_schedule_instructor_id_fkey";
ALTER TABLE "instructor_unavailability" DROP CONSTRAINT "instructor_unavailability_instructor_id_fkey";
ALTER TABLE "instructor_review" DROP CONSTRAINT "instructor_review_instructor_id_fkey";
ALTER TABLE "payments" DROP CONSTRAINT "payments_student_id_fkey";
ALTER TABLE "payments" DROP CONSTRAINT "payments_price_id_fkey";
ALTER TABLE "purchase_order" DROP CONSTRAINT "purchase_order_instructor_id_fkey";
ALTER TABLE "purchase_order" DROP CONSTRAINT "purchase_order_payment_id_fkey";

-- Étape 2: Modifier les types des colonnes ID principales
ALTER TABLE "instructor" ALTER COLUMN "id" TYPE INTEGER;
ALTER TABLE "instructor" ALTER COLUMN "id" SET DEFAULT nextval(pg_get_serial_sequence('instructor', 'id'));

ALTER TABLE "student" ALTER COLUMN "id" TYPE INTEGER;
ALTER TABLE "student" ALTER COLUMN "id" SET DEFAULT nextval(pg_get_serial_sequence('student', 'id'));

ALTER TABLE "tchat" ALTER COLUMN "id" TYPE INTEGER;
ALTER TABLE "tchat" ALTER COLUMN "id" SET DEFAULT nextval(pg_get_serial_sequence('tchat', 'id'));

ALTER TABLE "message" ALTER COLUMN "id" TYPE INTEGER;
ALTER TABLE "message" ALTER COLUMN "id" SET DEFAULT nextval(pg_get_serial_sequence('message', 'id'));

ALTER TABLE "credit_card" ALTER COLUMN "id" TYPE INTEGER;
ALTER TABLE "credit_card" ALTER COLUMN "id" SET DEFAULT nextval(pg_get_serial_sequence('credit_card', 'id'));

ALTER TABLE "appointment" ALTER COLUMN "id" TYPE INTEGER;
ALTER TABLE "appointment" ALTER COLUMN "id" SET DEFAULT nextval(pg_get_serial_sequence('appointment', 'id'));

ALTER TABLE "meeting_point" ALTER COLUMN "id" TYPE INTEGER;
ALTER TABLE "meeting_point" ALTER COLUMN "id" SET DEFAULT nextval(pg_get_serial_sequence('meeting_point', 'id'));

ALTER TABLE "availability_schedule" ALTER COLUMN "id" TYPE INTEGER;
ALTER TABLE "availability_schedule" ALTER COLUMN "id" SET DEFAULT nextval(pg_get_serial_sequence('availability_schedule', 'id'));

ALTER TABLE "instructor_unavailability" ALTER COLUMN "id" TYPE INTEGER;
ALTER TABLE "instructor_unavailability" ALTER COLUMN "id" SET DEFAULT nextval(pg_get_serial_sequence('instructor_unavailability', 'id'));

ALTER TABLE "instructor_review" ALTER COLUMN "id" TYPE INTEGER;
ALTER TABLE "instructor_review" ALTER COLUMN "id" SET DEFAULT nextval(pg_get_serial_sequence('instructor_review', 'id'));

ALTER TABLE "payments" ALTER COLUMN "id" TYPE INTEGER;
ALTER TABLE "payments" ALTER COLUMN "id" SET DEFAULT nextval(pg_get_serial_sequence('payments', 'id'));

ALTER TABLE "price" ALTER COLUMN "id" TYPE INTEGER;
ALTER TABLE "price" ALTER COLUMN "id" SET DEFAULT nextval(pg_get_serial_sequence('price', 'id'));

ALTER TABLE "purchase_order" ALTER COLUMN "id" TYPE INTEGER;
ALTER TABLE "purchase_order" ALTER COLUMN "id" SET DEFAULT nextval(pg_get_serial_sequence('purchase_order', 'id'));

-- Étape 3: Modifier les types des foreign keys
ALTER TABLE "instructor" ALTER COLUMN "price_id" TYPE INTEGER;
ALTER TABLE "student" ALTER COLUMN "credit_card_id" TYPE INTEGER;
ALTER TABLE "tchat" ALTER COLUMN "student_id" TYPE INTEGER;
ALTER TABLE "tchat" ALTER COLUMN "instructor_id" TYPE INTEGER;
ALTER TABLE "message" ALTER COLUMN "tchat_id" TYPE INTEGER;
ALTER TABLE "appointment" ALTER COLUMN "student_id" TYPE INTEGER;
ALTER TABLE "appointment" ALTER COLUMN "instructor_id" TYPE INTEGER;
ALTER TABLE "appointment" ALTER COLUMN "meeting_point_id" TYPE INTEGER;
ALTER TABLE "appointment" ALTER COLUMN "payment_id" TYPE INTEGER;
ALTER TABLE "meeting_point" ALTER COLUMN "instructor_id" TYPE INTEGER;
ALTER TABLE "availability_schedule" ALTER COLUMN "instructor_id" TYPE INTEGER;
ALTER TABLE "instructor_unavailability" ALTER COLUMN "instructor_id" TYPE INTEGER;
ALTER TABLE "instructor_review" ALTER COLUMN "instructor_id" TYPE INTEGER;
ALTER TABLE "payments" ALTER COLUMN "student_id" TYPE INTEGER;
ALTER TABLE "payments" ALTER COLUMN "price_id" TYPE INTEGER;
ALTER TABLE "purchase_order" ALTER COLUMN "instructor_id" TYPE INTEGER;
ALTER TABLE "purchase_order" ALTER COLUMN "payment_id" TYPE INTEGER;

-- Autres colonnes BIGINT à convertir
ALTER TABLE "student" ALTER COLUMN "NEPH" TYPE INTEGER;
ALTER TABLE "credit_card" ALTER COLUMN "card_number" TYPE BIGINT; -- Garder BIGINT pour les numéros de carte
ALTER TABLE "credit_card" ALTER COLUMN "CVV" TYPE INTEGER;
ALTER TABLE "purchase_order" ALTER COLUMN "VAT_number" TYPE BIGINT; -- Garder BIGINT pour les numéros de TVA

-- Étape 4: Recréer les sequences pour l'autoincrement
CREATE SEQUENCE IF NOT EXISTS instructor_id_seq OWNED BY instructor.id;
CREATE SEQUENCE IF NOT EXISTS student_id_seq OWNED BY student.id;
CREATE SEQUENCE IF NOT EXISTS tchat_id_seq OWNED BY tchat.id;
CREATE SEQUENCE IF NOT EXISTS message_id_seq OWNED BY message.id;
CREATE SEQUENCE IF NOT EXISTS credit_card_id_seq OWNED BY credit_card.id;
CREATE SEQUENCE IF NOT EXISTS appointment_id_seq OWNED BY appointment.id;
CREATE SEQUENCE IF NOT EXISTS meeting_point_id_seq OWNED BY meeting_point.id;
CREATE SEQUENCE IF NOT EXISTS availability_schedule_id_seq OWNED BY availability_schedule.id;
CREATE SEQUENCE IF NOT EXISTS instructor_unavailability_id_seq OWNED BY instructor_unavailability.id;
CREATE SEQUENCE IF NOT EXISTS instructor_review_id_seq OWNED BY instructor_review.id;
CREATE SEQUENCE IF NOT EXISTS payments_id_seq OWNED BY payments.id;
CREATE SEQUENCE IF NOT EXISTS price_id_seq OWNED BY price.id;
CREATE SEQUENCE IF NOT EXISTS purchase_order_id_seq OWNED BY purchase_order.id;

-- Étape 5: Remettre les contraintes de foreign key
ALTER TABLE "instructor" ADD CONSTRAINT "instructor_price_id_fkey" FOREIGN KEY ("price_id") REFERENCES "price"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "student" ADD CONSTRAINT "student_credit_card_id_fkey" FOREIGN KEY ("credit_card_id") REFERENCES "credit_card"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tchat" ADD CONSTRAINT "tchat_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tchat" ADD CONSTRAINT "tchat_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "message" ADD CONSTRAINT "message_tchat_id_fkey" FOREIGN KEY ("tchat_id") REFERENCES "tchat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_meeting_point_id_fkey" FOREIGN KEY ("meeting_point_id") REFERENCES "meeting_point"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "meeting_point" ADD CONSTRAINT "meeting_point_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "availability_schedule" ADD CONSTRAINT "availability_schedule_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "instructor_unavailability" ADD CONSTRAINT "instructor_unavailability_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "instructor_review" ADD CONSTRAINT "instructor_review_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_price_id_fkey" FOREIGN KEY ("price_id") REFERENCES "price"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
