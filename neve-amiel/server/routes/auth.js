const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { getPool } = require('../db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'נדרש שם משתמש וסיסמה' });

  try {
    const pool = getPool();
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND active = 1',
      [username.trim()]
    );
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'שם משתמש או סיסמה שגויים' });
    }

    await Promise.all([
      pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]),
      pool.query(
        'INSERT INTO audit_logs (user_id, action, ip_address, details) VALUES ($1,$2,$3,$4)',
        [user.id, 'login', req.ip, JSON.stringify({ username: user.username })]
      ),
    ]);

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

router.post('/register', async (req, res) => {
  const { username, password, full_name, admin_code } = req.body;
  if (!username || !password || !full_name) return res.status(400).json({ error: 'נדרשים שם משתמש, סיסמה ושם מלא' });
  if (password.length < 6)         return res.status(400).json({ error: 'הסיסמה חייבת להכיל לפחות 6 תווים' });
  if (username.trim().length < 3)  return res.status(400).json({ error: 'שם המשתמש חייב להכיל לפחות 3 תווים' });

  try {
    const pool = getPool();
    const { rows: ex } = await pool.query('SELECT id FROM users WHERE username = $1', [username.trim()]);
    if (ex.length) return res.status(409).json({ error: 'שם המשתמש כבר קיים במערכת' });

    const role = admin_code === 'NEVE2024ADMIN' ? 'admin' : 'staff';
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (username, password_hash, full_name, role) VALUES ($1,$2,$3,$4) RETURNING id',
      [username.trim(), hash, full_name.trim(), role]
    );
    const newId = rows[0].id;

    await pool.query(
      'INSERT INTO audit_logs (user_id, action, ip_address, details) VALUES ($1,$2,$3,$4)',
      [newId, 'register', req.ip, JSON.stringify({ username, role })]
    );

    const token = jwt.sign({ userId: newId }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ token, user: { id: newId, username: username.trim(), full_name: full_name.trim(), role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

router.get('/me', authenticateToken, (req, res) => res.json({ user: req.user }));

module.exports = router;
