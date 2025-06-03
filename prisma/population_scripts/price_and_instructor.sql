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