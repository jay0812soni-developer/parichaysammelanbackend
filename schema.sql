-- Parichay Sammelan — TiDB Cloud Starter (PostgreSQL compatible)
-- Run in the SQL editor after the instance is Active.
-- If the database already exists, skip CREATE DATABASE.

CREATE TABLE IF NOT EXISTS entries (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  photo_url VARCHAR(512) NOT NULL,
  cloudinary_public_id VARCHAR(255) DEFAULT NULL,
  name VARCHAR(255) NOT NULL,
  age INT NOT NULL,
  whatsapp VARCHAR(30) NOT NULL,
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('Male', 'Female')),
  height_cm INT NOT NULL,
  manglik VARCHAR(3) NOT NULL CHECK (manglik IN ('Yes', 'No')),
  marital_status VARCHAR(255) DEFAULT NULL,
  study VARCHAR(255) NOT NULL,
  yearly_income DOUBLE PRECISION NOT NULL,
  aadhaar VARCHAR(20) NOT NULL,
  father_name VARCHAR(255) NOT NULL,
  father_gautra VARCHAR(255) NOT NULL,
  mother_name VARCHAR(255) NOT NULL,
  mother_father_name VARCHAR(255) DEFAULT NULL,
  mother_gautra VARCHAR(255) NOT NULL,
  mother_parents_address TEXT DEFAULT NULL,
  present_address TEXT NOT NULL,
  permanent_address TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entries_email ON entries (email);
CREATE INDEX IF NOT EXISTS idx_entries_created ON entries (created_at);

CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
