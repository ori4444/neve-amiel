import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function InstructorLoginPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (sessionStorage.getItem('instructorName')) {
      navigate('/home', { replace: true });
    }
  }, [navigate]);

  const handleEnter = () => {
    if (!name.trim()) { setError('יש להזין שם מדריך'); return; }
    sessionStorage.setItem('instructorName', name.trim());
    navigate('/home');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') handleEnter();
  };

  return (
    <div className="page" style={{ justifyContent: 'center', minHeight: '100dvh' }}>
      <div style={{ padding: '0 24px', maxWidth: '380px', width: '100%', margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '56px', marginBottom: '14px' }}>💊</div>
          <div style={{ fontSize: '26px', fontWeight: '900', color: '#1e3a8a', marginBottom: '6px' }}>
            נווה עמיאל
          </div>
          <div style={{ fontSize: '15px', color: 'var(--gray-500)' }}>מערכת החתמות תרופות</div>
        </div>

        <div className="card" style={{ padding: '28px 24px' }}>
          <div style={{ fontSize: '17px', fontWeight: '700', color: '#1e293b', marginBottom: '20px', textAlign: 'center' }}>
            הזן/י את שמך להתחלה
          </div>

          <div className="form-group">
            <label className="form-label">שם המדריך/ה</label>
            <input
              className="form-input"
              type="text"
              placeholder=""
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              onKeyDown={handleKey}
              autoFocus
              style={{ fontSize: '17px', textAlign: 'right' }}
            />
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: '14px' }}>{error}</div>}

          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', fontSize: '17px' }}
            onClick={handleEnter}
            disabled={!name.trim()}
          >
            כניסה למערכת ←
          </button>
        </div>
      </div>
    </div>
  );
}
