const express = require('express');
const router  = express.Router();
const { getPool } = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const VALID_GRADES = ['ט','י','יא','יב'];

router.get('/', authenticateToken, async (req, res) => {
  const { grade, search, includeInactive } = req.query;
  try {
    const params = [];
    let idx = 1;
    let q = 'SELECT * FROM students WHERE 1=1';
    if (!includeInactive)  q += ' AND active = 1';
    if (grade)  { q += ` AND grade = $${idx++}`;         params.push(grade); }
    if (search) { q += ` AND name ILIKE $${idx++}`;      params.push(`%${search}%`); }
    q += ' ORDER BY grade, name';
    const { rows } = await getPool().query(q, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { name, grade, notes } = req.body;
  if (!name || !grade)               return res.status(400).json({ error: 'נדרשים שם וכיתה' });
  if (!VALID_GRADES.includes(grade)) return res.status(400).json({ error: 'כיתה לא תקינה' });

  try {
    const pool = getPool();
    const { rows } = await pool.query(
      'INSERT INTO students (name, grade, notes) VALUES ($1,$2,$3) RETURNING *',
      [name.trim(), grade, notes?.trim() || null]
    );
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5)',
      [req.user.id, 'add_student', 'student', rows[0].id, JSON.stringify({ name, grade })]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { name, grade, notes, active } = req.body;
  if (grade && !VALID_GRADES.includes(grade)) return res.status(400).json({ error: 'כיתה לא תקינה' });

  try {
    const pool = getPool();
    const { rows: cur } = await pool.query('SELECT * FROM students WHERE id = $1', [req.params.id]);
    if (!cur.length) return res.status(404).json({ error: 'תלמיד לא נמצא' });
    const s = cur[0];

    const { rows } = await pool.query(
      `UPDATE students SET name=$1, grade=$2, notes=$3, active=$4, updated_at=NOW() WHERE id=$5 RETURNING *`,
      [
        name?.trim()  || s.name,
        grade         || s.grade,
        notes !== undefined ? (notes?.trim() || null) : s.notes,
        active !== undefined ? (active ? 1 : 0) : s.active,
        req.params.id,
      ]
    );
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5)',
      [req.user.id, 'update_student', 'student', req.params.id, JSON.stringify({ name, grade, active })]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM students WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'תלמיד לא נמצא' });

    await pool.query('UPDATE students SET active=0, updated_at=NOW() WHERE id=$1', [req.params.id]);
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5)',
      [req.user.id, 'deactivate_student', 'student', req.params.id, JSON.stringify({ name: rows[0].name })]
    );
    res.json({ message: 'התלמיד הוסר בהצלחה' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

module.exports = router;
