import { useState, useEffect } from 'react';
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

const fmtShort = (dateStr) =>
  new Date(dateStr + 'T12:00:00').toLocaleDateString('he-IL', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

export default function SummaryViewPage() {
  const navigate = useNavigate();

  const [grade, setGrade] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [summaries, setSummaries] = useState([]);
  const [loadingSummaries, setLoadingSummaries] = useState(false);
  const [error, setError] = useState('');
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!grade) return;
    setAvailableDates([]);
    setFromDate('');
    setToDate('');
    setSummaries([]);
    setFetched(false);
    setError('');
    setLoadingDates(true);
    api.get(`/summaries/dates?grade=${grade}`)
      .then(res => setAvailableDates(res.data))
      .catch(() => setError('שגיאה בטעינת תאריכים'))
      .finally(() => setLoadingDates(false));
  }, [grade]);

  useEffect(() => {
    if (!grade || !fromDate || !toDate) return;
    setLoadingSummaries(true);
    setFetched(false);
    setError('');
    const effectiveFrom = fromDate <= toDate ? fromDate : toDate;
    const effectiveTo   = fromDate <= toDate ? toDate   : fromDate;
    api.get(`/summaries/range?grade=${grade}&from=${effectiveFrom}&to=${effectiveTo}`)
      .then(res => { setSummaries(res.data); setFetched(true); })
      .catch(() => setError('שגיאה בטעינת סיכומים'))
      .finally(() => setLoadingSummaries(false));
  }, [grade, fromDate, toDate]);

  const fromOptions = availableDates.filter(d => !toDate || d <= toDate);
  const toOptions   = availableDates.filter(d => !fromDate || d >= fromDate);

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/grades')}>← חזרה</button>
        <div>
          <div className="page-title">📋 סיכומים</div>
        </div>
        <div style={{ width: '64px' }} />
      </div>

      <div className="page-content">

        {/* Grade selection */}
        <div style={{ marginBottom: '24px' }}>
          <div className="form-label" style={{ fontSize: '15px', marginBottom: '10px' }}>בחר כיתה</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {GRADES.map(g => (
              <button
                key={g.value}
                onClick={() => setGrade(g.value)}
                style={{
                  padding: '14px 6px',
                  borderRadius: '14px',
                  border: `2px solid ${grade === g.value ? 'var(--primary)' : 'var(--gray-200)'}`,
                  background: grade === g.value ? 'var(--primary-xlight)' : 'white',
                  color: grade === g.value ? 'var(--primary-dark)' : 'var(--gray-700)',
                  fontWeight: grade === g.value ? '800' : '600',
                  fontSize: '18px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: grade === g.value ? '0 0 0 3px var(--primary-light)' : 'var(--shadow)',
                  fontFamily: 'inherit',
                }}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date range */}
        {grade && (
          <div style={{ marginBottom: '24px' }}>
            {loadingDates ? (
              <div className="loading-center">
                <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
              </div>
            ) : availableDates.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '28px 20px',
                background: 'white', borderRadius: '14px',
                color: 'var(--gray-400)', fontSize: '15px',
                boxShadow: 'var(--shadow)',
              }}>
                אין סיכומים לכיתה {grade}
              </div>
            ) : (
              <>
                <div className="form-label" style={{ fontSize: '15px', marginBottom: '10px' }}>בחר טווח תאריכים</div>
                <div className="grid-2">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">מתאריך</label>
                    <select
                      className="form-input"
                      value={fromDate}
                      onChange={e => setFromDate(e.target.value)}
                    >
                      <option value="">בחר...</option>
                      {fromOptions.map(d => (
                        <option key={d} value={d}>{fmtShort(d)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">עד תאריך</label>
                    <select
                      className="form-input"
                      value={toDate}
                      onChange={e => setToDate(e.target.value)}
                    >
                      <option value="">בחר...</option>
                      {toOptions.map(d => (
                        <option key={d} value={d}>{fmtShort(d)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        {/* Results */}
        {loadingSummaries ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : fetched && summaries.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '40px 20px',
            color: 'var(--gray-400)', fontSize: '15px',
            background: 'white', borderRadius: '14px',
            boxShadow: 'var(--shadow)',
          }}>
            אין סיכומים בטווח התאריכים הנבחר
          </div>
        ) : summaries.length > 0 ? (
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
                {/* Card header */}
                <div style={{
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                  padding: '13px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>
                    📅 {fmtLong(s.date)}
                  </span>
                  <span style={{
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: '700',
                    padding: '3px 11px',
                    borderRadius: '20px',
                    flexShrink: 0,
                  }}>
                    כיתה {s.grade}
                  </span>
                </div>

                {/* Author */}
                <div style={{
                  padding: '9px 18px',
                  background: 'var(--gray-50)',
                  borderBottom: '1px solid var(--gray-100)',
                  fontSize: '13px',
                  color: 'var(--gray-600)',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  ✍️ {s.staff_name || 'לא ידוע'}
                </div>

                {/* Content */}
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
        ) : null}

        {/* Spacer for FAB */}
        <div style={{ height: '80px' }} />
      </div>
    </div>
  );
}
