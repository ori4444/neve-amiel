import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const GRADES = ['ט', 'י', 'יא', 'יב'];
const EMPTY_FORM = { name: '', grade: 'ט', notes: '' };

export default function AdminStudents() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/students?includeInactive=true');
      setStudents(data);
    } catch { setError('שגיאה בטעינה'); } finally { setLoading(false); }
  };

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const openAdd = () => {
    setEditStudent(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  };

  const openEdit = (s) => {
    setEditStudent(s);
    setForm({ name: s.name, grade: s.grade, notes: s.notes || '' });
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('נדרש שם'); return; }
    setSubmitting(true); setError('');
    try {
      if (editStudent) {
        await api.put(`/students/${editStudent.id}`, form);
        setSuccess('התלמיד עודכן');
      } else {
        await api.post('/students', form);
        setSuccess('התלמיד נוסף');
      }
      setShowForm(false); setEditStudent(null);
      load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.response?.data?.error || 'שגיאה'); }
    finally { setSubmitting(false); }
  };

  const toggleActive = async (s) => {
    if (!confirm(`${s.active ? 'הסר' : 'הפעל'} את ${s.name}?`)) return;
    try {
      if (s.active) await api.delete(`/students/${s.id}`);
      else await api.put(`/students/${s.id}`, { active: 1 });
      load();
    } catch { setError('שגיאה בעדכון'); }
  };

  const filtered = students.filter(s =>
    (!filter || s.name.includes(filter)) &&
    (!gradeFilter || s.grade === gradeFilter)
  );

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin')}>← חזרה</button>
        <div className="page-title">ניהול תלמידים</div>
        <button className="btn btn-ghost btn-sm" onClick={openAdd}>+ הוסף</button>
      </div>

      <div className="page-content" style={{ maxWidth: '700px' }}>
        {success && <div className="alert alert-success">✓ {success}</div>}

        {showForm && (
          <div className="card" style={{ marginBottom: '20px', border: '2px solid var(--primary-light)' }}>
            <h3 style={{ fontWeight: '800', marginBottom: '18px', fontSize: '18px' }}>
              {editStudent ? `עריכת ${editStudent.name}` : 'הוספת תלמיד'}
            </h3>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">שם מלא</label>
              <input className="form-input" type="text" placeholder="שם התלמיד" value={form.name} onChange={set('name')} autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">כיתה</label>
              <select className="form-input" value={form.grade} onChange={set('grade')}>
                {GRADES.map(g => <option key={g} value={g}>כיתה {g}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">הערות (אופציונלי)</label>
              <input className="form-input" type="text" placeholder="הערות נוספות..." value={form.notes} onChange={set('notes')} />
            </div>
            <div className="grid-2">
              <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'שומר...' : 'שמור'}
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => { setShowForm(false); setError(''); }}>ביטול</button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
          <input className="form-input" type="text" placeholder="חיפוש שם..." value={filter} onChange={e => setFilter(e.target.value)} style={{ flex: 2 }} />
          <select className="form-input" value={gradeFilter} onChange={e => setGradeFilter(e.target.value)} style={{ flex: 1 }}>
            <option value="">כל הכיתות</option>
            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '10px', fontSize: '13px', color: 'var(--gray-500)' }}>
          {filtered.length} תלמידים · {filtered.filter(s => s.active).length} פעילים
        </div>

        {loading ? <div className="loading-center"><div className="spinner"/></div> : (
          <div className="student-list">
            {filtered.map(s => (
              <div key={s.id} className="student-card" style={{ opacity: s.active ? 1 : 0.5, cursor: 'default' }}>
                <div>
                  <div className="student-name">{s.name}</div>
                  <div className="student-meta">
                    כיתה {s.grade}
                    {!s.active && <span style={{ color: 'var(--danger)', marginRight: '6px' }}> · לא פעיל</span>}
                    {s.notes && <span style={{ color: 'var(--gray-400)' }}> · {s.notes}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button className="btn btn-sm btn-outline" onClick={() => openEdit(s)}>עריכה</button>
                  <button
                    className={`btn btn-sm ${s.active ? 'btn-danger' : 'btn-success'}`}
                    onClick={() => toggleActive(s)}
                  >
                    {s.active ? 'הסר' : 'הפעל'}
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-400)' }}>לא נמצאו תלמידים</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
