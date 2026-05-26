const express = require('express');
const router  = express.Router();
const { getPool } = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, requireAdmin, async (_req, res) => {
  try {
    const { rows } = await getPool().query(
      'SELECT id, username, full_name, role, active, created_at, last_login FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  if (Number(req.params.id) === req.user.id)
    return res.status(400).json({ error: 'לא ניתן לשנות הרשאות עצמאיות' });

  const { role, active } = req.body;
  try {
    const pool = getPool();
    const { rows: cur } = await pool.query('SELECT * FROM users WHERE id=$1', [req.params.id]);
    if (!cur.length) return res.status(404).json({ error: 'משתמש לא נמצא' });

    if (role   !== undefined) await pool.query('UPDATE users SET role=$1   WHERE id=$2', [role, req.params.id]);
    if (active !== undefined) await pool.query('UPDATE users SET active=$1 WHERE id=$2', [active ? 1 : 0, req.params.id]);

    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5)',
      [req.user.id, 'update_user', 'user', req.params.id, JSON.stringify({ role, active })]
    );

    const { rows } = await pool.query(
      'SELECT id, username, full_name, role, active FROM users WHERE id=$1',
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

module.exports = router;
