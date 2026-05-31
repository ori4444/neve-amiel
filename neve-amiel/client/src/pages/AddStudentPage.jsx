import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const GRADES = ['ט', 'י', 'יא', 'יב'];

export default function AddStudentPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) { setError('נדרש שם'); return; }
    if (!grade) { setError('נדרשת כיתה'); return; }

    setSubmitting(true);
    setError('');
    try {
      await api.post('/students', { name: name.trim(), grade });
      setSuccess(`התלמיד/ה ${name.trim()} נוסף/ה בהצלחה`);
      setName('');
      setGrade('');
    } catch (err) {
      setError(err.response?.data?.error || 'שגיאה בהוספה');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>← חזרה</button>
        <div>
          <div className="page-title">➕ הוספת תלמיד</div>
        </div>
        <div style={{ width: '68px' }} />
      </div>

      <div className="page-content">
        <div className="card">
          {success && (
            <div className="alert alert-success" style={{ marginBottom: '16px' }}>{success}</div>
          )}
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '16px' }}>{error}</div>
          )}

          <div className="form-group">
            <label className="form-label">שם התלמיד/ה</label>
            <input
              className="form-input"
              type="text"
              placeholder="הזן/י שם מלא..."
              value={name}
              onChange={e => { setName(e.target.value); setError(''); setSuccess(''); }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">כיתה</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {GRADES.map(g => (
                <button
                  key={g}
                  onClick={() => { setGrade(g); setError(''); setSuccess(''); }}
                  style={{
                    padding: '14px 6px',
                    borderRadius: '14px',
                    border: `2px solid ${grade === g ? 'var(--primary)' : 'var(--gray-200)'}`,
                    background: grade === g ? 'var(--primary-xlight)' : 'white',
                    color: grade === g ? 'var(--primary-dark)' : 'var(--gray-700)',
                    fontWeight: grade === g ? '800' : '600',
                    fontSize: '18px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    boxShadow: grade === g ? '0 0 0 3px var(--primary-light)' : 'var(--shadow)',
                    fontFamily: 'inherit',
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '8px' }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'מוסיף...' : 'הוסף תלמיד/ה'}
          </button>
        </div>
      </div>
    </div>
  );
}
