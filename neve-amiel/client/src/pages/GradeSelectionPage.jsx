import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GRADES = [
  { value: 'ט', label: "כיתה ט'", icon: '📚' },
  { value: 'י', label: "כיתה י'", icon: '📖' },
  { value: 'יא', label: "כיתה יא'", icon: '📝' },
  { value: 'יב', label: "כיתה יב'", icon: '🎓' },
];

export default function GradeSelectionPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const today = new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const handleSelect = (grade) => {
    sessionStorage.setItem('selectedGrade', grade);
    navigate('/signature-type');
  };

  const visibleGrades = user?.role === 'admin'
    ? GRADES
    : GRADES.filter(g => g.value === user?.grade);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">💊 נווה עמיאל</div>
          <div className="page-subtitle">שלום, {user?.full_name}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {user?.role === 'admin' && (
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin')}>ניהול</button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={logout}>יציאה</button>
        </div>
      </div>

      <div className="page-content">
        <div className="card" style={{ marginBottom: '20px', background: 'var(--primary-xlight)', border: '1px solid var(--primary-light)' }}>
          <div style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: '600' }}>📅 {today}</div>
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '6px' }}>בחר/י כיתה</h2>
        <p style={{ color: 'var(--gray-500)', marginBottom: '24px', fontSize: '15px' }}>לאיזו כיתה תרצה/י להחתים?</p>

        <div className="selection-grid">
          {visibleGrades.map(g => (
            <div key={g.value} className="selection-card" onClick={() => handleSelect(g.value)}>
              <div className="s-icon">{g.icon}</div>
              <div className="s-label">{g.value}</div>
              <div className="s-sub">{g.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
