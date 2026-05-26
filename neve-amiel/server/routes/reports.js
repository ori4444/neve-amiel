const express  = require('express');
const router   = express.Router();
const { getPool } = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const ExcelJS  = require('exceljs');

const TYPE_MAP   = { morning: 'בוקר', evening: 'ערב', other: 'תאריך אחר' };
const ACTION_MAP = { took: 'לקח/ה', refused: 'סירב/ה' };

router.get('/stats', authenticateToken, requireAdmin, async (_req, res) => {
  try {
    const pool  = getPool();
    const today = new Date().toISOString().split('T')[0];

    const [stu, staff, todaySig, total, byGrade, recent] = await Promise.all([
      pool.query('SELECT COUNT(*) AS c FROM students WHERE active=1'),
      pool.query('SELECT COUNT(*) AS c FROM users WHERE active=1'),
      pool.query('SELECT COUNT(*) AS c FROM signatures WHERE signing_date=$1', [today]),
      pool.query('SELECT COUNT(*) AS c FROM signatures'),
      pool.query(
        `SELECT st.grade, COUNT(*) AS count
         FROM signatures s JOIN students st ON s.student_id=st.id
         WHERE s.signing_date=$1 GROUP BY st.grade ORDER BY st.grade`,
        [today]
      ),
      pool.query(
        `SELECT s.*, st.name AS student_name, st.grade, u.full_name AS staff_name
         FROM signatures s
         JOIN students st ON s.student_id=st.id
         JOIN users u ON s.user_id=u.id
         ORDER BY s.created_at DESC LIMIT 15`
      ),
    ]);

    res.json({
      totalStudents:    parseInt(stu.rows[0].c),
      totalStaff:       parseInt(staff.rows[0].c),
      todaySignatures:  parseInt(todaySig.rows[0].c),
      totalSignatures:  parseInt(total.rows[0].c),
      byGrade:          byGrade.rows,
      recentSignatures: recent.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

router.get('/export/excel', authenticateToken, requireAdmin, async (req, res) => {
  const { start_date, end_date, grade, signing_type } = req.query;
  try {
    const params = [];
    let idx = 1;
    let q = `
      SELECT s.signing_date, s.signing_type, st.name AS student_name, st.grade,
             u.full_name AS staff_name, s.action, s.reason,
             s.is_override, s.override_reason, s.created_at
      FROM signatures s
      JOIN students st ON s.student_id=st.id
      JOIN users u ON s.user_id=u.id
      WHERE 1=1
    `;
    if (start_date)  { q += ` AND s.signing_date >= $${idx++}`; params.push(start_date); }
    if (end_date)    { q += ` AND s.signing_date <= $${idx++}`; params.push(end_date); }
    if (grade)       { q += ` AND st.grade = $${idx++}`;        params.push(grade); }
    if (signing_type){ q += ` AND s.signing_type = $${idx++}`;  params.push(signing_type); }
    q += ' ORDER BY s.signing_date DESC, st.grade, st.name';

    const { rows } = await getPool().query(q, params);

    const wb    = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet('חתימות', { views: [{ rightToLeft: true }] });

    sheet.columns = [
      { header: 'תאריך',      key: 'date',           width: 14 },
      { header: 'סוג חתימה', key: 'type',           width: 14 },
      { header: 'שם תלמיד',  key: 'student',        width: 22 },
      { header: 'כיתה',      key: 'grade',           width: 8  },
      { header: 'מחתים',     key: 'staff',           width: 22 },
      { header: 'פעולה',     key: 'action',          width: 10 },
      { header: 'הערה',      key: 'reason',          width: 26 },
      { header: 'עדכון',     key: 'override',        width: 8  },
      { header: 'סיבת עדכון',key: 'overrideReason', width: 26 },
      { header: 'זמן יצירה', key: 'created',         width: 22 },
    ];

    const hdr = sheet.getRow(1);
    hdr.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    hdr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    hdr.alignment = { horizontal: 'right' };

    rows.forEach(r => {
      sheet.addRow({
        date:          r.signing_date,
        type:          TYPE_MAP[r.signing_type]  || r.signing_type,
        student:       r.student_name,
        grade:         r.grade,
        staff:         r.staff_name,
        action:        ACTION_MAP[r.action] || r.action,
        reason:        r.reason || '',
        override:      r.is_override ? 'כן' : 'לא',
        overrideReason:r.override_reason || '',
        created:       r.created_at,
      });
    });

    sheet.eachRow((row, n) => { if (n > 1) row.alignment = { horizontal: 'right' }; });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="neve-amiel-${new Date().toISOString().split('T')[0]}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאת ייצוא' });
  }
});

router.get('/medication', authenticateToken, async (req, res) => {
  const { start_date, end_date, grade } = req.query;
  if (!start_date || !end_date) return res.status(400).json({ error: 'נדרשים תאריכי התחלה וסיום' });
  try {
    const params = [start_date, end_date];
    let q = `
      SELECT s.signing_date, s.signing_type, s.action, s.reason,
             st.name AS student_name, st.grade,
             u.full_name AS staff_name
      FROM signatures s
      JOIN students st ON s.student_id = st.id
      JOIN users u ON s.user_id = u.id
      WHERE s.signing_date >= $1 AND s.signing_date <= $2
    `;
    if (grade) { q += ` AND st.grade = $3`; params.push(grade); }
    q += ' ORDER BY s.signing_date, st.grade, st.name, s.signing_type';
    const { rows } = await getPool().query(q, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

router.get('/audit', authenticateToken, requireAdmin, async (_req, res) => {
  try {
    const { rows } = await getPool().query(`
      SELECT al.*, u.full_name AS user_name
      FROM audit_logs al LEFT JOIN users u ON al.user_id=u.id
      ORDER BY al.created_at DESC LIMIT 500
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

module.exports = router;
