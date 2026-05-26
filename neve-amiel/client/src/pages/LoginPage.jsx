import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', password: '', full_name: '', admin_code: '' });
  const [showAdminCode, setShowAdminCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload = mode === 'login'
        ? { username: form.username, password: form.password }
        : { username: form.username, password: form.password, full_name: form.full_name, admin_code: showAdminCode ? form.admin_code : undefined };
      const { data } = await api.post(endpoint, payload);
      login(data.token, data.user);
      navigate('/grades');
    } catch (err) {
      const msg = err.response?.data?.error;
      setError(typeof msg === 'string' ? msg : err.code === 'ERR_NETWORK' ? 'לא ניתן להתחבר לשרת' : 'שגיאת שרת, נסה/י שוב');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m) => { setMode(m); setError(''); setForm({ username: '', password: '', full_name: '', admin_code: '' }); setShowAdminCode(false); };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '20px',
    }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '28px', color: 'white' }}>
        <div style={{ fontSize: '72px', marginBottom: '10px', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>💊</div>
        <h1 style={{ fontSize: '26px', fontWeight: '900', letterSpacing: '-0.5px' }}>החתמת תרופות</h1>
        <p style={{ fontSize: '20px', fontWeight: '600', opacity: 0.9, marginTop: '4px' }}>נווה עמיאל</p>
      </div>

      {/* Card */}
      <div style={{
        background: 'white', borderRadius: '24px', padding: '28px 22px',
        width: '100%', maxWidth: '420px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
      }}>
        <div className="tabs" style={{ marginBottom: '24px' }}>
          <div className={`tab ${mode === 'login' ? 'active' : ''}`} onClick={() => switchMode('login')}>כניסה</div>
          <div className={`tab ${mode === 'register' ? 'active' : ''}`} onClick={() => switchMode('register')}>הרשמה</div>
        </div>

        {error && <div className="alert alert-error">⚠ {error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">שם מלא</label>
              <input className="form-input" type="text" placeholder="ישראל ישראלי" value={form.full_name} onChange={set('full_name')} required autoComplete="name" />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">שם משתמש</label>
            <input className="form-input" type="text" placeholder="הכנס/י שם משתמש" value={form.username} onChange={set('username')} required autoComplete="username" />
          </div>

          <div className="form-group">
            <label className="form-label">סיסמה</label>
            <input className="form-input" type="password" placeholder={mode === 'register' ? 'לפחות 6 תווים' : 'הכנס/י סיסמה'} value={form.password} onChange={set('password')} required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={showAdminCode} onChange={e => setShowAdminCode(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                הרשמה כמנהל מערכת
              </label>
              {showAdminCode && (
                <input className="form-input" type="password" placeholder="קוד מנהל מערכת" value={form.admin_code} onChange={set('admin_code')} style={{ marginTop: '8px' }} />
              )}
            </div>
          )}

          <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading} style={{ marginTop: '4px' }}>
            {loading
              ? <><span className="spinner" style={{ width: 22, height: 22, borderWidth: 3 }} /> מעבד...</>
              : mode === 'login' ? 'כניסה למערכת' : 'הרשמה'}
          </button>
        </form>

      </div>
    </div>
  );
}
