const express = require('express');
const router  = express.Router();
const { getPool } = require('../db');

const VALID_GRADES = ['ט','י','יא','יב'];

router.get('/', async (req, res) => {
  const { grade, search, includeInactive } = req.query;
  try {
    const params = [];
    let idx = 1;
    let q = 'SELECT * FROM students WHERE 1=1';
    if (!includeInactive)  q += ' AND active = 1';
    if (grade)  { q += ` AND grade = $${idx++}`;    params.push(grade); }
    if (search) { q += ` AND name ILIKE $${idx++}`; params.push(`%${search}%`); }
    q += ' ORDER BY grade, name';
    const { rows } = await getPool().query(q, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

router.post('/', async (req, res) => {
  const { name, grade } = req.body;
  if (!name || !grade)               return res.status(400).json({ error: 'נדרשים שם וכיתה' });
  if (!VALID_GRADES.includes(grade)) return res.status(400).json({ error: 'כיתה לא תקינה' });

  try {
    const existing = await getPool().query(
      'SELECT id FROM students WHERE name = $1 AND grade = $2',
      [name.trim(), grade]
    );
    if (existing.rows.length > 0)
      return res.status(409).json({ error: `התלמיד/ה ${name.trim()} כבר קיים/ת בכיתה ${grade}` });

    const { rows } = await getPool().query(
      'INSERT INTO students (name, grade) VALUES ($1,$2) RETURNING *',
      [name.trim(), grade]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

module.exports = router;
