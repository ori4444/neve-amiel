const express = require('express');
const router  = express.Router();
const { getPool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
  const { date, student_id, grade, user_id, signing_type, start_date, end_date } = req.query;
  try {
    const params = [];
    let idx = 1;
    let q = `
      SELECT s.*, st.name AS student_name, st.grade, u.full_name AS staff_name
      FROM signatures s
      JOIN students st ON s.student_id = st.id
      JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    if (date)        { q += ` AND s.signing_date = $${idx++}`;    params.push(date); }
    if (student_id)  { q += ` AND s.student_id = $${idx++}`;      params.push(student_id); }
    if (grade)       { q += ` AND st.grade = $${idx++}`;          params.push(grade); }
    if (user_id)     { q += ` AND s.user_id = $${idx++}`;         params.push(user_id); }
    if (signing_type){ q += ` AND s.signing_type = $${idx++}`;    params.push(signing_type); }
    if (start_date)  { q += ` AND s.signing_date >= $${idx++}`;   params.push(start_date); }
    if (end_date)    { q += ` AND s.signing_date <= $${idx++}`;   params.push(end_date); }
    q += ' ORDER BY s.created_at DESC';

    const { rows } = await getPool().query(q, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const { student_id, signing_type, signing_date, action, reason, override_reason } = req.body;
  if (!student_id || !signing_type || !signing_date || !action)
    return res.status(400).json({ error: 'חסרים שדות חובה' });
  if (!['morning','evening','other'].includes(signing_type))
    return res.status(400).json({ error: 'סוג חתימה לא תקין' });
  if (!['took','refused'].includes(action))
    return res.status(400).json({ error: 'פעולה לא תקינה' });

  try {
    const pool = getPool();

    const { rows: stuRows } = await pool.query(
      'SELECT id FROM students WHERE id = $1 AND active = 1',
      [student_id]
    );
    if (!stuRows.length) return res.status(404).json({ error: 'תלמיד לא נמצא' });

    const { rows: ex } = await pool.query(
      'SELECT * FROM signatures WHERE student_id=$1 AND signing_type=$2 AND signing_date=$3',
      [student_id, signing_type, signing_date]
    );
    const existing = ex[0];

    if (existing && !override_reason) {
      return res.status(409).json({ error: 'קיימת כבר חתימה לתלמיד זה בתאריך ובסוג זה', existing, requiresOverride: true });
    }

    if (existing && override_reason) {
      await pool.query(
        `UPDATE signatures
           SET action=$1, reason=$2, override_reason=$3, is_override=1, user_id=$4, created_at=NOW()
         WHERE id=$5`,
        [action, reason || null, override_reason, req.user.id, existing.id]
      );
      await pool.query(
        'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5)',
        [req.user.id, 'override_signature', 'signature', existing.id,
          JSON.stringify({ student_id, signing_type, signing_date, override_reason })]
      );
      const { rows: updated } = await pool.query('SELECT * FROM signatures WHERE id=$1', [existing.id]);
      return res.json(updated[0]);
    }

    const { rows } = await pool.query(
      `INSERT INTO signatures (student_id, user_id, signing_type, signing_date, action, reason)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [student_id, req.user.id, signing_type, signing_date, action, reason || null]
    );
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5)',
      [req.user.id, 'create_signature', 'signature', rows[0].id,
        JSON.stringify({ student_id, signing_type, signing_date, action })]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

module.exports = router;
