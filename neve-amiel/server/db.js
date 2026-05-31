const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    const dbUrl = process.env.DATABASE_URL || '';
    const rawPassword = process.env.DB_PASSWORD;

    let config;
    if (rawPassword && dbUrl) {
      const parsed = new URL(dbUrl);
      config = {
        user:     parsed.username,
        host:     parsed.hostname,
        database: parsed.pathname.replace(/^\//, ''),
        password: rawPassword,
        port:     Number(parsed.port) || 5432,
        ssl:      { rejectUnauthorized: false },
        max:      2,
        idleTimeoutMillis:    30000,
        connectionTimeoutMillis: 15000,
      };
    } else {
      config = {
        connectionString: dbUrl,
        ssl: dbUrl ? { rejectUnauthorized: false } : false,
        max: 2,
        idleTimeoutMillis:    30000,
        connectionTimeoutMillis: 15000,
      };
    }

    pool = new Pool(config);
    pool.on('error', (err) => console.error('[pool error]', err.message));
  }
  return pool;
}

async function initializeDatabase() {
  const client = await getPool().connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        id         SERIAL PRIMARY KEY,
        name       TEXT NOT NULL,
        grade      TEXT NOT NULL CHECK (grade IN ('ט','י','יא','יב')),
        active     INTEGER DEFAULT 1,
        notes      TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS signatures (
        id           SERIAL PRIMARY KEY,
        student_id   INTEGER NOT NULL REFERENCES students(id),
        signing_type TEXT NOT NULL CHECK (signing_type IN ('morning','evening','other')),
        signing_date DATE NOT NULL,
        action       TEXT NOT NULL CHECK (action IN ('took','refused')),
        reason       TEXT,
        override_reason TEXT,
        is_override  INTEGER DEFAULT 0,
        created_at   TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (student_id, signing_type, signing_date)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_summaries (
        id         SERIAL PRIMARY KEY,
        grade      TEXT NOT NULL CHECK (grade IN ('ט','י','יא','יב')),
        date       DATE NOT NULL,
        content    TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (grade, date)
      )
    `);

    // migration: make user_id nullable on existing deployments
    await client.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='signatures' AND column_name='user_id'
        ) THEN
          ALTER TABLE signatures ALTER COLUMN user_id DROP NOT NULL;
        END IF;
      END $$
    `);

    // migration: add instructor_name column if not exists
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='signatures' AND column_name='instructor_name'
        ) THEN
          ALTER TABLE signatures ADD COLUMN instructor_name TEXT;
        END IF;
      END $$
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_sig_date    ON signatures(signing_date)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sig_student ON signatures(student_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_stu_grade   ON students(grade)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sum_grade_date ON daily_summaries(grade, date)`);

    // migration: add student_id and student_name to daily_summaries
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='daily_summaries' AND column_name='student_id'
        ) THEN
          ALTER TABLE daily_summaries ADD COLUMN student_id INTEGER REFERENCES students(id);
          ALTER TABLE daily_summaries ADD COLUMN student_name TEXT;
        END IF;
      END $$
    `);

    // migration: drop old grade+date unique constraint, add per-student unique index
    await client.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE table_name='daily_summaries' AND constraint_type='UNIQUE'
          AND constraint_name='daily_summaries_grade_date_key'
        ) THEN
          ALTER TABLE daily_summaries DROP CONSTRAINT daily_summaries_grade_date_key;
        END IF;
      END $$
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_sum_student_date
        ON daily_summaries(student_id, date)
        WHERE student_id IS NOT NULL
    `);

    const { rows } = await client.query('SELECT COUNT(*) AS c FROM students');
    if (parseInt(rows[0].c) === 0) {
      const samples = [
        ['אברהם כהן','ט'], ['שרה לוי','ט'], ['יעקב ישראלי','ט'], ['מיכל דוד','ט'],
        ['רחל גולן','י'], ['דוד מזרחי','י'], ['מרים פרץ','י'], ['יוסי אלוני','י'],
        ['יצחק אברהם','יא'], ['לאה שמש','יא'], ['משה בן דוד','יא'], ['תמר גבאי','יא'],
        ['חנה אזולאי','יב'], ['אליהו כץ','יב'], ['רבקה שפירא','יב'], ['נועם ברק','יב'],
      ];
      for (const [name, grade] of samples) {
        await client.query('INSERT INTO students (name, grade) VALUES ($1,$2)', [name, grade]);
      }
    }
  } finally {
    client.release();
  }
}

module.exports = { getPool, initializeDatabase };
