import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

function StudentRow({ s }) {
  const [noteOpen, setNoteOpen] = useState(false);
  return (
    <div
      style={{
        borderRadius: '10px',
        background: s.action === 'took' ? '#f0fdf4' : '#fef2f2',
        border: `1px solid ${s.action === 'took' ? '#bbf7d0' : '#fecaca'}`,
        overflow: 'hidden',
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <span style={{ fontWeight: '700', fontSize: '14px' }}>{s.student_name}</span>
          {s.instructor_name && (
            <span style={{ fontSize: '12px', color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span>חתם/ה:</span>
              <span style={{ fontWeight: '600', color: 'var(--gray-700)' }}>{s.instructor_name}</span>
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {s.reason && (
            <button
              onClick={() => setNoteOpen(o => !o)}
              style={{
                fontSize: '12px',
                color: 'var(--primary)',
                background: 'transparent',
                border: '1px solid var(--primary-light)',
                borderRadius: '8px',
                padding: '2px 8px',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              📝 {noteOpen ? 'סגור' : 'הערה'}
            </button>
          )}
          <span className={`badge ${s.action === 'took' ? 'badge-green' : 'badge-red'}`}>
            {s.action === 'took' ? 'לקח/ה' : 'סירב/ה'}
          </span>
        </div>
      </div>
      {noteOpen && s.reason && (
        <div style={{
          padding: '8px 12px',
          borderTop: `1px solid ${s.action === 'took' ? '#bbf7d0' : '#fecaca'}`,
          fontSize: '13px',
          color: 'var(--gray-700)',
          background: s.action === 'took' ? '#dcfce7' : '#fee2e2',
        }}>
          {s.reason}
        </div>
      )}
    </div>
  );
}

const GRADES = ['ט', 'י', 'יא', 'יב'];
const TYPE_LABELS = { morning: 'בוקר', evening: 'ערב', other: 'אחר' };

const fmtDate = (dateStr) => {
  if (!dateStr) return '';
  const clean = String(dateStr).split('T')[0];
  return new Date(clean + 'T12:00:00').toLocaleDateString('he-IL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
};

export default function AttendanceSummaryPage() {
  const navigate = useNavigate();
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetched, setFetched] = useState(false);

  const toggleGrade = (g) => {
    setSelectedGrades(prev =>
      prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
    );
    setRecords([]);
    setFetched(false);
  };

  const handleSearch = async () => {
    if (!selectedGrades.length || !fromDate || !toDate) { setError('נדרשים כיתה, מתאריך ועד תאריך'); return; }
    setLoading(true);
    setError('');
    setFetched(false);
    try {
      const from = fromDate <= toDate ? fromDate : toDate;
      const to   = fromDate <= toDate ? toDate   : fromDate;
      const res = await api.get(`/signatures?grade=${selectedGrades.join(',')}&start_date=${from}&end_date=${to}`);
      setRecords(res.data);
      setFetched(true);
    } catch {
      setError('שגיאה בטעינת נתונים');
    } finally {
      setLoading(false);
    }
  };

  // group by date + signing_type, sorted chronologically descending
  const grouped = records.reduce((acc, r) => {
    const key = `${r.signing_date}_${r.signing_type}`;
    if (!acc[key]) acc[key] = { date: r.signing_date, type: r.signing_type, students: [] };
    acc[key].students.push(r);
    return acc;
  }, {});
  const groups = Object.values(grouped).sort((a, b) =>
    b.date.localeCompare(a.date) || a.type.localeCompare(b.type)
  );

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>← חזרה</button>
        <div>
          <div className="page-title">📊 סיכומי החתמות</div>
        </div>
        <div style={{ width: '64px' }} />
      </div>

      <div className="page-content">

        {/* Grade selection */}
        <div style={{ marginBottom: '20px' }}>
          <div className="form-label" style={{ fontSize: '15px', marginBottom: '10px' }}>בחר כיתות (ניתן לבחור כמה)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {GRADES.map(g => {
              const selected = selectedGrades.includes(g);
              return (
                <button
                  key={g}
                  onClick={() => toggleGrade(g)}
                  style={{
                    padding: '14px 6px',
                    borderRadius: '14px',
                    border: `2px solid ${selected ? 'var(--primary)' : 'var(--gray-200)'}`,
                    background: selected ? 'var(--primary-xlight)' : 'white',
                    color: selected ? 'var(--primary-dark)' : 'var(--gray-700)',
                    fontWeight: selected ? '800' : '600',
                    fontSize: '18px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    boxShadow: selected ? '0 0 0 3px var(--primary-light)' : 'var(--shadow)',
                    fontFamily: 'inherit',
                  }}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        {/* Date range */}
        <div className="grid-2" style={{ marginBottom: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">מתאריך</label>
            <input
              className="form-input"
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">עד תאריך</label>
            <input
              className="form-input"
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
            />
          </div>
        </div>

        <button
          className="btn btn-primary btn-lg"
          style={{ width: '100%', marginBottom: '20px' }}
          onClick={handleSearch}
          disabled={loading || !selectedGrades.length || !fromDate || !toDate}
        >
          {loading ? 'טוען...' : 'הצג נתונים'}
        </button>

        {error && <div className="alert alert-error">{error}</div>}

        {fetched && groups.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '40px 20px',
            color: 'var(--gray-400)', fontSize: '15px',
            background: 'white', borderRadius: '14px',
            boxShadow: 'var(--shadow)',
          }}>
            אין החתמות בטווח התאריכים הנבחר
          </div>
        )}

        {groups.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {groups.map(g => {
              const took    = g.students.filter(s => s.action === 'took').length;
              const refused = g.students.filter(s => s.action === 'refused').length;
              return (
                <div
                  key={`${g.date}_${g.type}`}
                  style={{
                    background: 'white',
                    borderRadius: '18px',
                    boxShadow: 'var(--shadow-md)',
                    overflow: 'hidden',
                    border: '1px solid var(--gray-200)',
                  }}
                >
                  {/* Header */}
                  <div style={{
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                    padding: '13px 18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <span style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>
                      📅 {fmtDate(g.date)}
                    </span>
                    <span style={{
                      background: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontSize: '13px',
                      fontWeight: '700',
                      padding: '3px 11px',
                      borderRadius: '20px',
                    }}>
                      {TYPE_LABELS[g.type] || g.type}
                    </span>
                  </div>

                  {/* Stats */}
                  <div style={{
                    padding: '10px 18px',
                    background: 'var(--gray-50)',
                    borderBottom: '1px solid var(--gray-100)',
                    display: 'flex',
                    gap: '16px',
                    fontSize: '13px',
                    fontWeight: '600',
                  }}>
                    <span style={{ color: 'var(--success)' }}>✓ לקחו: {took}</span>
                    <span style={{ color: 'var(--danger)' }}>✗ סירבו: {refused}</span>
                    <span style={{ color: 'var(--gray-500)' }}>סה"כ: {g.students.length}</span>
                  </div>

                  {/* Student rows */}
                  <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {g.students.map(s => <StudentRow key={s.id} s={s} />)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ height: '80px' }} />
      </div>
    </div>
  );
}
