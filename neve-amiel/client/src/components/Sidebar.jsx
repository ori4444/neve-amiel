import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function MenuItem({ icon, label, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '14px 16px',
        borderRadius: '12px',
        background: hover ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.15)',
        color: 'white',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        width: '100%',
        fontFamily: 'inherit',
        textAlign: 'right',
        transition: 'background 0.15s',
      }}
    >
      <span style={{ fontSize: '20px' }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  if (!user) return null;

  const go = (path) => {
    setOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/');
  };

  return (
    <>
      {/* Hamburger FAB */}
      <button
        onClick={() => setOpen(true)}
        aria-label="תפריט"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '20px',
          zIndex: 800,
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          background: 'var(--primary)',
          color: 'white',
          border: 'none',
          fontSize: '22px',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(37,99,235,0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.08)';
          e.currentTarget.style.boxShadow = '0 6px 22px rgba(37,99,235,0.55)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,99,235,0.45)';
        }}
      >
        ☰
      </button>

      {/* Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 1001,
          }}
        />
      )}

      {/* Drawer — slides in from the right */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: open ? 0 : '-300px',
          width: '280px',
          height: '100%',
          background: 'linear-gradient(180deg, #1e3a8a 0%, #1d4ed8 100%)',
          zIndex: 1002,
          transition: 'right 0.3s cubic-bezier(0.4,0,0.2,1)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: open ? '-4px 0 28px rgba(0,0,0,0.35)' : 'none',
          direction: 'rtl',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '22px 20px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: '19px', fontWeight: '800', color: 'white' }}>💊 נווה עמיאל</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginTop: '3px' }}>{user.full_name}</div>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              fontSize: '18px',
              cursor: 'pointer',
              borderRadius: '10px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'inherit',
            }}
          >
            ✕
          </button>
        </div>

        {/* Menu items */}
        <div style={{ flex: 1, padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <MenuItem icon="🏠" label="בית" onClick={() => go('/grades')} />
          <MenuItem icon="📋" label="סיכומים" onClick={() => go('/summaries')} />
          {user.role === 'admin' && (
            <MenuItem icon="⚙️" label="ניהול" onClick={() => go('/admin')} />
          )}
        </div>

        {/* Logout */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '13px 16px',
              borderRadius: '12px',
              background: 'rgba(220,38,38,0.18)',
              border: '1px solid rgba(220,38,38,0.35)',
              color: '#fca5a5',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontFamily: 'inherit',
              direction: 'rtl',
            }}
          >
            <span>🚪</span>
            <span>יציאה</span>
          </button>
        </div>
      </div>
    </>
  );
}
