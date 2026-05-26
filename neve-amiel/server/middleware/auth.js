const jwt = require('jsonwebtoken');
const { getPool } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'neve-amiel-jwt-secret-2024-change-in-prod';

async function authenticateToken(req, res, next) {
  const header = req.headers['authorization'];
  const token = header && header.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'נדרשת התחברות' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { rows } = await getPool().query(
      'SELECT id, username, full_name, role, active, grade FROM users WHERE id = $1',
      [decoded.userId]
    );
    const user = rows[0];
    if (!user || !user.active) return res.status(401).json({ error: 'משתמש לא פעיל' });
    req.user = user;
    next();
  } catch {
    return res.status(403).json({ error: 'טוקן לא תקין' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'נדרשות הרשאות מנהל' });
  next();
}

module.exports = { authenticateToken, requireAdmin, JWT_SECRET };
