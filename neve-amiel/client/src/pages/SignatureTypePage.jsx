import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TYPES = [
  { value: 'morning', label: 'החתמת בוקר', icon: '🌅', sub: 'תרופות בוקר' },
  { value: 'evening', label: 'החתמת ערב', icon: '🌙', sub: 'תרופות ערב' },
  { value: 'other', label: 'תאריך אחר', icon: '📅', sub: 'שכחתי להחתים' },
];

export default function SignatureTypePage() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [grade, setGrade] = useState('');

  useEffect(() => {
    const g = sessionStorage.getItem('selectedGrade');
    if (!g) navigate('/grades');
    else setGrade(g);
  }, [navigate]);

  const handleSelect = (type) => {
    if (type === 'other') { setShowDatePicker(true); return; }
    sessionStorage.setItem('signingType', type);
    sessionStorage.setItem('signingDate', new Date().toISOString().split('T')[0]);
    navigate('/signing');
  };

  const handleDateConfirm = () => {
    if (!selectedDate) return;
    sessionStorage.setItem('signingDate', selectedDate);
    setShowDatePicker(false);
    setShowTimePicker(true);
  };

  const handleTimeSelect = (type) => {
    sessionStorage.setItem('signingType', type);
    navigate('/signing');
  };

  if (!grade) return null;

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/grades')}>← חזרה</button>
        <div>
          <div className="page-title">כיתה {grade}</div>
          <div className="page-subtitle">בחר/י סוג החתמה</div>
        </div>
        <div style={{ width: '68px' }} />
      </div>

      <div className="page-content">
        {showTimePicker ? (
          <div className="card">
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '18px' }}>🕐 בוקר או ערב?</h3>
            <p style={{ color: 'var(--gray-500)', marginBottom: '20px', fontSize: '15px' }}>
              בחר/י את סוג ההחתמה לתאריך שנבחר
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { value: 'morning', label: 'החתמת בוקר', icon: '🌅', sub: 'תרופות בוקר' },
                { value: 'evening', label: 'החתמת ערב', icon: '🌙', sub: 'תרופות ערב' },
              ].map(t => (
                <div
                  key={t.value}
                  className="selection-card"
                  style={{ flexDirection: 'row', padding: '20px 22px', minHeight: '82px', textAlign: 'right', justifyContent: 'flex-start', gap: '18px', borderRadius: '16px' }}
                  onClick={() => handleTimeSelect(t.value)}
                >
                  <div style={{ fontSize: '38px', lineHeight: 1 }}>{t.icon}</div>
                  <div>
                    <div className="s-label" style={{ fontSize: '19px', textAlign: 'right' }}>{t.label}</div>
                    <div className="s-sub" style={{ textAlign: 'right', marginTop: '4px' }}>{t.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost btn-lg" style={{ marginTop: '14px', width: '100%' }} onClick={() => { setShowTimePicker(false); setShowDatePicker(true); }}>
              ← חזרה לבחירת תאריך
            </button>
          </div>
        ) : showDatePicker ? (
          <div className="card">
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '18px' }}>📅 בחר/י תאריך</h3>
            <div className="form-group">
              <label className="form-label">תאריך החתמה</label>
              <input
                className="form-input"
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="grid-2" style={{ marginTop: '8px' }}>
              <button className="btn btn-primary btn-lg" onClick={handleDateConfirm} disabled={!selectedDate}>המשך</button>
              <button className="btn btn-secondary btn-lg" onClick={() => setShowDatePicker(false)}>ביטול</button>
            </div>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '6px' }}>סוג ההחתמה</h2>
            <p style={{ color: 'var(--gray-500)', marginBottom: '24px', fontSize: '15px' }}>בחר/י את סוג ההחתמה לכיתה {grade}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {TYPES.map(t => (
                <div
                  key={t.value}
                  className="selection-card"
                  style={{ flexDirection: 'row', padding: '20px 22px', minHeight: '82px', textAlign: 'right', justifyContent: 'flex-start', gap: '18px', borderRadius: '16px' }}
                  onClick={() => handleSelect(t.value)}
                >
                  <div style={{ fontSize: '38px', lineHeight: 1 }}>{t.icon}</div>
                  <div>
                    <div className="s-label" style={{ fontSize: '19px', textAlign: 'right' }}>{t.label}</div>
                    <div className="s-sub" style={{ textAlign: 'right', marginTop: '4px' }}>{t.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
