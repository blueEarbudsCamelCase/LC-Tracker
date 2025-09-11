const fs = require('fs');
const path = require('path');
const { pool } = require('../src/lib/db');

async function migrate() {
  const sql = `
CREATE TABLE IF NOT EXISTS schools (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zones (
  id SERIAL PRIMARY KEY,
  school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS entries (
  id SERIAL PRIMARY KEY,
  school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
  day TEXT,
  date DATE,
  period INTEGER,
  student_id INTEGER REFERENCES students(id) ON DELETE SET NULL,
  type TEXT,
  zone_id INTEGER REFERENCES zones(id) ON DELETE SET NULL,
  zone_detail TEXT,
  action TEXT,
  notes TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);
`;
  try {
    await pool.query(sql);
    console.log('Migration applied');
    process.exit(0);
  } catch (e) {
    console.error('Migration error', e);
    process.exit(1);
  }
}

migrate();
