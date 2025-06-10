-- Script de remplissage de la base de données
-- À exécuter dans l'outil Database de WebStorm

-- 1. Insertion du prix
INSERT INTO price (id, amount, currency)
VALUES (1, 20, 'EUR')
    ON CONFLICT (id) DO NOTHING;

-- 2. Insertion de l'instructeur
INSERT INTO instructor (
    price_id,
    first_name,
    last_name,
    gender,
    email,
    phone_number,
    address,
    password,
    siret,
    driver_licence_url,
    registration_certificate_url,
    insurance_certificate_url,
    degree_url,
    teaching_authorization_url,
    created_at,
    updated_at,
    "IBAN",
    "BIC"
) VALUES (
             1,                              -- price_id (référence au prix créé)
             'hugo',                         -- first_name
             'boss',                         -- last_name
             'male',                         -- gender
             'user@example.com',             -- email
             '0606060606',                   -- phone_number
             'this is fake address',         -- address
             'password123',                  -- password (attention: en production, utilisez un hash)
             '1234',                         -- siret
             'string',                       -- driver_licence_url
             'string',                       -- registration_certificate_url
             'string',                       -- insurance_certificate_url
             'string',                       -- degree_url
             'string',                       -- teaching_authorization_url
             CURRENT_DATE,                   -- created_at
             CURRENT_DATE,                   -- updated_at
             '1243',                         -- IBAN
             '123'                           -- BIC
         )
    ON CONFLICT (email) DO NOTHING;

-- 3. Insertion d'une disponibilité récurrente
INSERT INTO availability_schedule (
    instructor_id,
    start_datetime,
    end_datetime,
    is_recurring,
    recurrence_rule,
    expiry_date,
    note
) VALUES (
             (SELECT id FROM instructor WHERE email = 'user@example.com'),
             '2026-01-15 09:00:00',          -- start_datetime
             '2026-01-15 17:00:00',          -- end_datetime
             true,                           -- is_recurring
             'WEEKLY',                       -- recurrence_rule
             '2026-12-31',                   -- expiry_date
             'Disponible tous les mercredis' -- note
         );

-- 4. Insertion d'une indisponibilité
INSERT INTO instructor_unavailability (
    instructor_id,
    start_datetime,
    end_datetime,
    reason
) VALUES (
             (SELECT id FROM instructor WHERE email = 'user@example.com'),
             '2026-02-10 00:00:00',          -- start_datetime
             '2026-02-14 23:59:59',          -- end_datetime
             'Congés d''hiver'               -- reason
         );

-- Vérification des données insérées
SELECT 'Prix inséré:' as info;
SELECT * FROM price WHERE id = 1;

SELECT 'Instructeur inséré:' as info;
SELECT
    id,
    first_name,
    last_name,
    email,
    siret,
    "IBAN",
    "BIC",
    created_at
FROM instructor
WHERE email = 'user@example.com';

SELECT 'Disponibilité insérée:' as info;
SELECT
    id,
    instructor_id,
    start_datetime,
    end_datetime,
    is_recurring,
    recurrence_rule,
    expiry_date,
    note
FROM availability_schedule
WHERE instructor_id = (SELECT id FROM instructor WHERE email = 'user@example.com');

SELECT 'Indisponibilité insérée:' as info;
SELECT
    id,
    instructor_id,
    start_datetime,
    end_datetime,
    reason
FROM instructor_unavailability
WHERE instructor_id = (SELECT id FROM instructor WHERE email = 'user@example.com');