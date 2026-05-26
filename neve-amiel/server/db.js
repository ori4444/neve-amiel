require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

let pool;

function getPool() {
  if (!pool) {
    // If DB_PASSWORD is set, parse the URL and inject the raw password as a
    // separate field — avoids any URL-encoding issues with special characters.
    const dbUrl = process.env.DATABASE_URL || '';
    const rawPassword = process.env.DB_PASSWORD;

    let config;
    if (rawPassword && dbUrl) {
      const parsed = new URL(dbUrl);
      config = {
        user:     parsed.username,
        host:     parsed.hostname,
        database: parsed.pathname.replace(/^\//, ''),
        password: rawPassword,           // raw string, no URL encoding needed
        port:     Number(parsed.port) || 5432,
        ssl:      { rejectUnauthorized: false },
        max:      2,
        idleTimeoutMillis:    10000,
        connectionTimeoutMillis: 5000,
      };
    } else {
      config = {
        connectionString: dbUrl,
        ssl: dbUrl ? { rejectUnauthorized: false } : false,
        max: 2,
        idleTimeoutMillis:    10000,
        connectionTimeoutMillis: 5000,
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
    // --- Schema ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          SERIAL PRIMARY KEY,
        username    TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name   TEXT NOT NULL,
        role        TEXT DEFAULT 'staff' CHECK (role IN ('admin','staff')),
        active      INTEGER DEFAULT 1,
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        last_login  TIMESTAMPTZ
      )
    `);

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
        user_id      INTEGER NOT NULL REFERENCES users(id),
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
      CREATE TABLE IF NOT EXISTS audit_logs (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER REFERENCES users(id),
        action      TEXT NOT NULL,
        entity_type TEXT,
        entity_id   INTEGER,
        details     TEXT,
        ip_address  TEXT,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_sig_date    ON signatures(signing_date)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sig_student ON signatures(student_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sig_user    ON signatures(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_stu_grade   ON students(grade)`);

    // --- Seed default admin + sample students if DB is empty ---
    const { rows } = await client.query('SELECT COUNT(*) AS c FROM users');
    if (parseInt(rows[0].c) === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      await client.query(
        'INSERT INTO users (username, password_hash, full_name, role) VALUES ($1,$2,$3,$4)',
        ['admin', hash, 'מנהל מערכת', 'admin']
      );

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
