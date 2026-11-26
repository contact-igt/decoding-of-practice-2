CREATE TABLE IF NOT EXISTS dop_assessment_attempts (
  owner text PRIMARY KEY,
  phone text NOT NULL UNIQUE,
  registration_key text NOT NULL UNIQUE,
  expires bigint NOT NULL,
  record text NOT NULL
);
