import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const GRADES = [
  { value: 'ט', label: "ט'" },
  { value: 'י', label: "י'" },
  { value: 'יא', label: "יא'" },
  { value: 'יב', label: "יב'" },
];

const fmtLong = (dateStr) =>
  new Date(dateStr + 'T12:00:00').toLocaleDateString('he-IL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

export default function SummaryViewPage() {
  const navigate = useNavigate();

  const [selectedGrades, setSelectedGrades] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetched, setFetched] = useState(false);

  const toggleGrade = (g) => {
    setSelectedGrades(prev =>
      prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
    );
    setSummaries([]);
    setFetched(false);
  };

  const handleSearch = async () => {
    if (!selectedGrades.length || !fromDate || !toDate) {
      setError('נדרשים כיתה, מתאריך ועד תאריך');
      return;
    }
    setLoading(true);
    setFetched(false);
    setError('');
    const effectiveFrom = fromDate <= toDate ? fromDate : toDate;
    const effectiveTo   = fromDate <= toDate ? toDate   : fromDate;
    try {
      const res = await api.get('/summaries/range', {
        params: { grades: selectedGrades.join(','), from: effectiveFrom, to: effectiveTo },
      });
      setSummaries(res.data);
      setFetched(true);
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.debug
        ? `שגיאה: ${JSON.stringify(err.response.data)}`
        : 'שגיאה בטעינת סיכומים';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>← חזרה</button>
        <div>
          <div className="page-title">📋 סיכומים יומיים</div>
        </div>
        <div style={{ width: '64px' }} />
      </div>

      <div className="page-content">

        <div style={{ marginBottom: '24px' }}>
          <div className="form-label" style={{ fontSize: '15px', marginBottom: '10px' }}>בחר כיתות (ניתן לבחור כמה)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {GRADES.map(g => {
              const selected = selectedGrades.includes(g.value);
              return (
                <button
                  key={g.value}
                  onClick={() => toggleGrade(g.value)}
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
                  {g.label}
                </button>
              );
            })}
          </div>
        </div>

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
          {loading ? 'טוען...' : 'הצג סיכומים'}
        </button>

        {error && <div className="alert alert-error">{error}</div>}

        {fetched && summaries.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '40px 20px',
            color: 'var(--gray-400)', fontSize: '15px',
            background: 'white', borderRadius: '14px',
            boxShadow: 'var(--shadow)',
          }}>
            אין סיכומים בטווח התאריכים הנבחר
          </div>
        )}

        {summaries.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {summaries.map(s => (
              <div
                key={s.id}
                style={{
                  background: 'white',
                  borderRadius: '18px',
                  boxShadow: 'var(--shadow-md)',
                  overflow: 'hidden',
                  border: '1px solid var(--gray-200)',
                }}
              >
                <div style={{
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                  padding: '13px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span style={{ color: 'white', fontWeight: '700', fontSize: '14px', flexShrink: 0 }}>
                    📅 {fmtLong(s.date)}
                  </span>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {s.student_name && (
                      <span style={{
                        background: 'rgba(255,255,255,0.25)',
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: '700',
                        padding: '3px 11px',
                        borderRadius: '20px',
                      }}>
                        👤 {s.student_name}
                      </span>
                    )}
                    <span style={{
                      background: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontSize: '13px',
                      fontWeight: '700',
                      padding: '3px 11px',
                      borderRadius: '20px',
                    }}>
                      כיתה {s.grade}
                    </span>
                  </div>
                </div>

                <div style={{
                  padding: '16px 18px',
                  fontSize: '15px',
                  lineHeight: '1.75',
                  color: 'var(--gray-800)',
                  whiteSpace: 'pre-wrap',
                }}>
                  {s.content}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ height: '80px' }} />
      </div>
    </div>
  );
}