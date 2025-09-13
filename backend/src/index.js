const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { pool } = require('./lib/db');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'secret_local_change';

// simple auth middleware
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing auth' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid auth' });
  try {
    const payload = jwt.verify(parts[1], JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Register: a school-level account (shared by teachers)
app.post('/api/auth/register', async (req, res) => {
  const { email, password, school_name } = req.body;
  if (!email || !password || !school_name) return res.status(400).json({ error: 'Missing fields' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO schools (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, hash, school_name]
    );
    const school = result.rows[0];
    const token = jwt.sign({ schoolId: school.id, email: school.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, school });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const result = await pool.query('SELECT id, email, password_hash, name FROM schools WHERE email = $1', [email]);
    const school = result.rows[0];
    if (!school) return res.status(400).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, school.password_hash);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ schoolId: school.id, email: school.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, school: { id: school.id, email: school.email, name: school.name } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// CRUD: Students
app.post('/api/students', authMiddleware, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing name' });
  try {
    const result = await pool.query('INSERT INTO students (school_id, name) VALUES ($1, $2) RETURNING *', [req.user.schoolId, name]);
    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/students', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM students WHERE school_id = $1 ORDER BY name', [req.user.schoolId]);
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// CRUD: Zones
app.post('/api/zones', authMiddleware, async (req, res) => {
  const { name, category } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing name' });
  try {
    const result = await pool.query('INSERT INTO zones (school_id, name, category) VALUES ($1, $2, $3) RETURNING *', [req.user.schoolId, name, category]);
    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/zones', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM zones WHERE school_id = $1 ORDER BY name', [req.user.schoolId]);
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Entries: create and list (filter by date/week/period)
app.post('/api/entries', authMiddleware, async (req, res) => {
  const { day, date, period, student_id, type, zone_id, zone_detail, action, notes, timestamp } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO entries (school_id, day, date, period, student_id, type, zone_id, zone_detail, action, notes, timestamp)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [req.user.schoolId, day, date, period, student_id, type, zone_id, zone_detail, action, notes, timestamp || new Date()]
    );
    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/entries', authMiddleware, async (req, res) => {
  const { from_date, to_date, period } = req.query;
  let sql = 'SELECT * FROM entries WHERE school_id = $1';
  const params = [req.user.schoolId];
  if (from_date) { params.push(from_date); sql += ` AND date >= $${params.length}`; }
  if (to_date) { params.push(to_date); sql += ` AND date <= $${params.length}`; }
  if (period) { params.push(period); sql += ` AND period = $${params.length}`; }
  sql += ' ORDER BY date DESC, period';
  try {
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server running on ${port}`));
