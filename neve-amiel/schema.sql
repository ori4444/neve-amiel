-- Neve Amiel – PostgreSQL schema
-- Run this in Supabase SQL Editor (or let the app auto-create on first boot).
-- Safe to re-run (all statements use IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  role          TEXT DEFAULT 'staff' CHECK (role IN ('admin','staff')),
  active        INTEGER DEFAULT 1,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  last_login    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS students (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  grade      TEXT NOT NULL CHECK (grade IN ('ט','י','יא','יב')),
  active     INTEGER DEFAULT 1,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS signatures (
  id              SERIAL PRIMARY KEY,
  student_id      INTEGER NOT NULL REFERENCES students(id),
  user_id         INTEGER NOT NULL REFERENCES users(id),
  signing_type    TEXT NOT NULL CHECK (signing_type IN ('morning','evening','other')),
  signing_date    DATE NOT NULL,
  action          TEXT NOT NULL CHECK (action IN ('took','refused')),
  reason          TEXT,
  override_reason TEXT,
  is_override     INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, signing_type, signing_date)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id),
  action      TEXT NOT NULL,
  entity_type TEXT,
  entity_id   INTEGER,
  details     TEXT,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sig_date    ON signatures(signing_date);
CREATE INDEX IF NOT EXISTS idx_sig_student ON signatures(student_id);
CREATE INDEX IF NOT EXISTS idx_sig_user    ON signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_stu_grade   ON students(grade);
