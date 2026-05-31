const express = require('express');
const router  = express.Router();
const { getPool } = require('../db');

router.get('/dates', async (req, res) => {
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

router.get('/range', async (req, res) => {
  console.log('[summaries/range] raw query:', JSON.stringify(req.query));
  const { grade, grades, from, to } = req.query;
  const gradeList = grades
    ? (typeof grades === 'string' ? grades.split(',') : (Array.isArray(grades) ? grades : [String(grades)]))
    : (grade ? (Array.isArray(grade) ? grade : [grade]) : []);
  if (!gradeList.length || !from || !to) {
    console.log('[summaries/range] validation failed:', { gradeList, from, to, gradesType: typeof grades });
    return res.status(400).json({ error: 'נדרשים grade/grades, from ו-to', debug: { grades, grade, from, to } });
  }
  try {
    const { rows } = await getPool().query(
      `SELECT ds.id, ds.grade, ds.date::text AS date, ds.content,
              ds.student_id, ds.student_name,
              ds.created_at, ds.updated_at
       FROM daily_summaries ds
       WHERE ds.grade = ANY($1) AND ds.date >= $2::date AND ds.date <= $3::date
       ORDER BY ds.date DESC, ds.grade, ds.student_name`,
      [gradeList, from, to]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

router.get('/', async (req, res) => {
  const { grade, date, student_id } = req.query;
  if (!date) return res.status(400).json({ error: 'נדרש date' });
  try {
    let result;
    if (student_id) {
      result = await getPool().query(
        `SELECT * FROM daily_summaries WHERE student_id = $1 AND date = $2`,
        [student_id, date]
      );
    } else if (grade) {
      result = await getPool().query(
        `SELECT * FROM daily_summaries WHERE grade = $1 AND date = $2 AND student_id IS NULL`,
        [grade, date]
      );
    } else {
      return res.status(400).json({ error: 'נדרש student_id או grade' });
    }
    res.json(result.rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

router.post('/', async (req, res) => {
  const { grade, date, content, student_id, student_name } = req.body;
  if (!date || !content?.trim())
    return res.status(400).json({ error: 'נדרשים date ו-content' });

  try {
    let rows;
    if (student_id) {
      const result = await getPool().query(
        `INSERT INTO daily_summaries (grade, date, content, student_id, student_name)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (student_id, date) WHERE student_id IS NOT NULL DO UPDATE
           SET content = EXCLUDED.content,
               updated_at = NOW()
         RETURNING *`,
        [grade || '', date, content.trim(), student_id, student_name || null]
      );
      rows = result.rows;
    } else {
      if (!grade) return res.status(400).json({ error: 'נדרש grade' });
      const result = await getPool().query(
        `INSERT INTO daily_summaries (grade, date, content)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING
         RETURNING *`,
        [grade, date, content.trim()]
      );
      rows = result.rows;
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

module.exports = router;
