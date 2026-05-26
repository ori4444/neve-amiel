const express = require('express');
const router  = express.Router();
const { getPool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.get('/dates', authenticateToken, async (req, res) => {
  const { grade } = req.query;
  if (!grade) return res.status(400).json({ error: 'נדרש grade' });
  try {
    const { rows } = await getPool().query(
      `SELECT DISTINCT date::text AS date FROM daily_summaries WHERE grade = $1 ORDER BY date DESC`,
      [grade]
    );
    res.json(rows.map(r => r.date));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

router.get('/range', authenticateToken, async (req, res) => {
  const { grade, from, to } = req.query;
  if (!grade || !from || !to) return res.status(400).json({ error: 'נדרשים grade, from ו-to' });
  try {
    const { rows } = await getPool().query(
      `SELECT ds.id, ds.grade, ds.date::text AS date, ds.content, ds.user_id,
              ds.created_at, ds.updated_at, u.full_name AS staff_name
       FROM daily_summaries ds
       LEFT JOIN users u ON ds.user_id = u.id
       WHERE ds.grade = $1 AND ds.date >= $2::date AND ds.date <= $3::date
       ORDER BY ds.date DESC`,
      [grade, from, to]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  const { grade, date } = req.query;
  if (!grade || !date) return res.status(400).json({ error: 'נדרשים grade ו-date' });
  try {
    const { rows } = await getPool().query(
      `SELECT ds.*, u.full_name AS staff_name
       FROM daily_summaries ds
       LEFT JOIN users u ON ds.user_id = u.id
       WHERE ds.grade = $1 AND ds.date = $2`,
      [grade, date]
    );
    res.json(rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const { grade, date, content } = req.body;
  if (!grade || !date || !content?.trim())
    return res.status(400).json({ error: 'נדרשים grade, date ו-content' });

  try {
    const pool = getPool();
    const { rows } = await pool.query(
      `INSERT INTO daily_summaries (grade, date, content, user_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (grade, date) DO UPDATE
         SET content = EXCLUDED.content,
             user_id = EXCLUDED.user_id,
             updated_at = NOW()
       RETURNING *`,
      [grade, date, content.trim(), req.user.id]
    );
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5)',
      [req.user.id, 'save_summary', 'daily_summary', rows[0].id, JSON.stringify({ grade, date })]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

module.exports = router;