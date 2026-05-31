import { useNavigate } from 'react-router-dom';

const today = new Date().toLocaleDateString('he-IL', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
});

const TILES = [
  {
    icon: '✍️',
    title: 'החתמות',
    sub: '',
    path: '/grades',
    bg: '#eff6ff',
  },
  {
    icon: '📋',
    title: 'סיכומים יומיים',
    sub: '',
    path: '/summaries',
    bg: '#f5f3ff',
  },
  {
    icon: '📊',
    title: 'סיכומי החתמות',
    sub: '',
    path: '/attendance-report',
    bg: '#ecfeff',
  },
  {
    icon: '➕',
    title: 'הוספת תלמיד',
    sub: '',
    path: '/add-student',
    bg: '#f0fdf4',
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const instructorName = sessionStorage.getItem('instructorName') || '';

  const handleLogout = () => {
    sessionStorage.removeItem('instructorName');
    navigate('/');
  };

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-ghost btn-sm" onClick={handleLogout} style={{ fontSize: '13px' }}>
          יציאה
        </button>
        <div>
          <div className="page-title">💊 נווה עמיאל</div>
          <div className="page-subtitle">מערכת החתמות תרופות</div>
        </div>
        <div style={{ width: '60px' }} />
      </div>

      <div className="page-content">
        <div className="card" style={{ marginBottom: '20px', background: 'var(--primary-xlight)', border: '1px solid var(--primary-light)' }}>
          <div style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: '600' }}>📅 {today}</div>
          {instructorName && (
            <div style={{ fontSize: '13px', color: 'var(--primary-dark)', marginTop: '4px' }}>
              👤 מדריך/ה: <strong>{instructorName}</strong>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {TILES.map(t => (
            <Tile key={t.path} tile={t} onClick={() => navigate(t.path)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Tile({ tile: t, onClick }) {
  return (
    <div
      onClick={onClick}
      role="button"
      style={{
        background: 'white',
        borderRadius: '20px',
        padding: '24px 14px',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-md)',
        border: `2px solid ${t.bg}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        textAlign: 'center',
        userSelect: 'none',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.13)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
    >
      <div style={{
        width: '60px',
        height: '60px',
        borderRadius: '18px',
        background: t.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '28px',
      }}>
        {t.icon}
      </div>
      <div style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>{t.title}</div>
      <div style={{ fontSize: '12px', color: 'var(--gray-500)', lineHeight: '1.45' }}>{t.sub}</div>
    </div>
  );
}
