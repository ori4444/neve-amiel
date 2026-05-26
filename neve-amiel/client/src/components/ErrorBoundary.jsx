import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '32px',
          background: '#f8fafc', textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>שגיאה בטעינת הדף</h2>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>אנא רענן/י את הדף ונסה/י שוב</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#2563eb', color: 'white', border: 'none',
              borderRadius: '12px', padding: '12px 28px', fontSize: '16px',
              fontWeight: '700', cursor: 'pointer',
            }}
          >
            רענן דף
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}