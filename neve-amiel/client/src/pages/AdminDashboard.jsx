import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const TYPE_LABELS  = { morning: 'בוקר', evening: 'ערב', other: 'תאריך אחר' };
const ACTION_LABELS = { took: 'לקח/ה', refused: 'סירב/ה' };

function StatCard({ value, label, color }) {
  return (
    <div className="stat-card">
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('dashboard');

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [signatures, setSignatures] = useState([]);
  const [sigsLoading, setSigsLoading] = useState(false);
  const [filters, setFilters] = useState({ start_date: '', end_date: '', grade: '', signing_type: '', student: '' });
  const [exporting, setExporting] = useState(false);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [reportFilters, setReportFilters] = useState({ start_date: '', end_date: '', grade: '' });
  const [reportData, setReportData] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSearched, setReportSearched] = useState(false);

  useEffect(() => {
    if (tab === 'dashboard') loadStats();
    if (tab === 'signatures') loadSignatures();
    if (tab === 'users') loadUsers();
  }, [tab]);

  const loadStats = async () => {
    try { setStatsLoading(true); const { data } = await api.get('/reports/stats'); setStats(data); }
    catch {} finally { setStatsLoading(false); }
  };

  const loadSignatures = useCallback(async () => {
    try {
      setSigsLoading(true);
      const params = new URLSearchParams();
      if (filters.start_date) params.set('start_date', filters.start_date);
      if (filters.end_date) params.set('end_date', filters.end_date);
      if (filters.grade) params.set('grade', filters.grade);
      if (filters.signing_type) params.set('signing_type', filters.signing_type);
      const { data } = await api.get(`/signatures?${params}`);
      setSignatures(filters.student ? data.filter(s => s.student_name.includes(filters.student)) : data);
    } catch {} finally { setSigsLoading(false); }
  }, [filters]);

  const loadUsers = async () => {
    try { setUsersLoading(true); const { data } = await api.get('/users'); setUsers(data); }
    catch {} finally { setUsersLoading(false); }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (filters.start_date) params.set('start_date', filters.start_date);
      if (filters.end_date) params.set('end_date', filters.end_date);
      if (filters.grade) params.set('grade', filters.grade);
      if (filters.signing_type) params.set('signing_type', filters.signing_type);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/reports/export/excel?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = `neve-amiel-${new Date().toISOString().split('T')[0]}.xlsx`; a.click();
    } catch {} finally { setExporting(false); }
  };

  const toggleUserRole = async (u) => {
    const newRole = u.role === 'admin' ? 'staff' : 'admin';
    if (!confirm(`שנה הרשאות של ${u.full_name} ל-${newRole === 'admin' ? 'מנהל' : 'צוות'}?`)) return;
    try { await api.put(`/users/${u.id}`, { role: newRole }); loadUsers(); } catch {}
  };

  const loadReport = async () => {
    if (!reportFilters.start_date || !reportFilters.end_date) return;
    try {
      setReportLoading(true);
      setReportSearched(true);
      const params = new URLSearchParams();
      params.set('start_date', reportFilters.start_date);
      params.set('end_date', reportFilters.end_date);
      if (reportFilters.grade) params.set('grade', reportFilters.grade);
      const { data } = await api.get(`/reports/medication?${params}`);
      setReportData(data);
    } catch {} finally { setReportLoading(false); }
  };

  const pivotReport = (data) => {
    const map = new Map();
    data.forEach(row => {
      const key = `${row.signing_date}|${row.student_name}|${row.grade}`;
      if (!map.has(key)) map.set(key, { date: row.signing_date, name: row.student_name, grade: row.grade, morning: null, evening: null, other: null });
      map.get(key)[row.signing_type] = { action: row.action, staff: row.staff_name };
    });
    return Array.from(map.values());
  };

  const setReportFilter = (k) => (e) => setReportFilters(p => ({ ...p, [k]: e.target.value }));

  const setFilter = (k) => (e) => setFilters(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/grades')}>← ראשי</button>
        <div className="page-title">ניהול מערכת</div>
        <button className="btn btn-ghost btn-sm" onClick={logout}>יציאה</button>
      </div>

      <div style={{ padding: '0 16px', background: 'white', borderBottom: '2px solid var(--gray-200)' }}>
        <div className="tabs" style={{ marginBottom: 0 }}>
          {[['dashboard','דשבורד'],['signatures','חתימות'],['reports','דוחות'],['users','משתמשים'],['students','תלמידים']].map(([k, l]) => (
            <div key={k} className={`tab ${tab === k ? 'active' : ''}`}
              onClick={() => k === 'students' ? navigate('/admin/students') : setTab(k)}>
              {l}
            </div>
          ))}
        </div>
      </div>

      <div className="page-content" style={{ maxWidth: '860px' }}>

        {/* ── Dashboard ── */}
        {tab === 'dashboard' && (
          statsLoading ? <div className="loading-center"><div className="spinner"/></div> : stats && (
            <>
              <div className="grid-2" style={{ marginBottom: '20px' }}>
                <StatCard value={stats.totalStudents} label="תלמידים פעילים" color="var(--primary)" />
                <StatCard value={stats.todaySignatures} label="חתימות היום" color="var(--success)" />
                <StatCard value={stats.totalStaff} label="אנשי צוות" color="var(--warning)" />
                <StatCard value={stats.totalSignatures} label='סה"כ חתימות' color="var(--gray-600)" />
              </div>

              {stats.byGrade.length > 0 && (
                <div className="card" style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontWeight: '700', marginBottom: '14px' }}>חתימות היום לפי כיתה</h3>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {stats.byGrade.map(g => (
                      <span key={g.grade} className="badge badge-blue" style={{ fontSize: '15px', padding: '6px 14px' }}>
                        כיתה {g.grade}: {g.count}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="card">
                <h3 style={{ fontWeight: '700', marginBottom: '16px' }}>חתימות אחרונות</h3>
                {stats.recentSignatures.length === 0
                  ? <p style={{ color: 'var(--gray-400)', textAlign: 'center', padding: '20px 0' }}>אין חתימות עדיין</p>
                  : stats.recentSignatures.map(s => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--gray-100)' }}>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '15px' }}>{s.student_name} <span style={{ color: 'var(--gray-400)', fontWeight: 400, fontSize: '13px' }}>כיתה {s.grade}</span></div>
                        <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '2px' }}>{s.staff_name} · {TYPE_LABELS[s.signing_type]} · {s.signing_date}</div>
                      </div>
                      <span className={`badge ${s.action === 'took' ? 'badge-green' : 'badge-red'}`}>{ACTION_LABELS[s.action]}</span>
                    </div>
                  ))}
              </div>
            </>
          )
        )}

        {/* ── Signatures ── */}
        {tab === 'signatures' && (
          <>
            <div className="card" style={{ marginBottom: '16px' }}>
              <h3 style={{ fontWeight: '700', marginBottom: '14px' }}>סינון חתימות</h3>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">מתאריך</label>
                  <input className="form-input" type="date" value={filters.start_date} onChange={setFilter('start_date')} />
                </div>
                <div className="form-group">
                  <label className="form-label">עד תאריך</label>
                  <input className="form-input" type="date" value={filters.end_date} onChange={setFilter('end_date')} />
                </div>
                <div className="form-group">
                  <label className="form-label">כיתה</label>
                  <select className="form-input" value={filters.grade} onChange={setFilter('grade')}>
                    <option value="">כל הכיתות</option>
                    {['ט','י','יא','יב'].map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">סוג</label>
                  <select className="form-input" value={filters.signing_type} onChange={setFilter('signing_type')}>
                    <option value="">הכל</option>
                    <option value="morning">בוקר</option>
                    <option value="evening">ערב</option>
                    <option value="other">תאריך אחר</option>
                  </select>
                </div>
              </div>
              <input className="form-input" style={{ marginBottom: '12px' }} type="text" placeholder="חיפוש לפי שם תלמיד" value={filters.student} onChange={setFilter('student')} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-primary" onClick={loadSignatures}>חפש</button>
                <button className="btn btn-success" onClick={handleExport} disabled={exporting}>
                  {exporting ? 'מייצא...' : '⬇ Excel'}
                </button>
              </div>
            </div>

            {sigsLoading ? <div className="loading-center"><div className="spinner"/></div> : (
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      {['תאריך','שם תלמיד','כיתה','סוג','פעולה','מחתים','הערה'].map(h => <th key={h}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {signatures.map(s => (
                      <tr key={s.id}>
                        <td>{s.signing_date}</td>
                        <td style={{ fontWeight: '600' }}>{s.student_name}</td>
                        <td>{s.grade}</td>
                        <td>{TYPE_LABELS[s.signing_type]}</td>
                        <td><span className={`badge ${s.action === 'took' ? 'badge-green' : 'badge-red'}`}>{ACTION_LABELS[s.action]}</span></td>
                        <td>{s.staff_name}</td>
                        <td style={{ color: 'var(--gray-500)', fontSize: '13px' }}>{s.reason || ''}</td>
                      </tr>
                    ))}
                    {signatures.length === 0 && (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--gray-400)' }}>לא נמצאו חתימות</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── Reports ── */}
        {tab === 'reports' && (
          <>
            <div className="card" style={{ marginBottom: '16px' }}>
              <h3 style={{ fontWeight: '700', marginBottom: '14px' }}>דוח מצב תרופות</h3>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">מתאריך</label>
                  <input className="form-input" type="date" value={reportFilters.start_date} onChange={setReportFilter('start_date')} />
                </div>
                <div className="form-group">
                  <label className="form-label">עד תאריך</label>
                  <input className="form-input" type="date" value={reportFilters.end_date} onChange={setReportFilter('end_date')} />
                </div>
                <div className="form-group">
                  <label className="form-label">כיתה</label>
                  <select className="form-input" value={reportFilters.grade} onChange={setReportFilter('grade')}>
                    <option value="">כל הכיתות</option>
                    {['ט','י','יא','יב'].map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={loadReport}
                disabled={!reportFilters.start_date || !reportFilters.end_date || reportLoading}
              >
                {reportLoading ? 'טוען...' : 'הפק דוח'}
              </button>
            </div>

            {reportLoading && <div className="loading-center"><div className="spinner"/></div>}

            {!reportLoading && reportSearched && reportData.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-400)' }}>
                לא נמצאו נתונים לטווח התאריכים הנבחר
              </div>
            )}

            {!reportLoading && reportData.length > 0 && (
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>תאריך</th>
                      <th>שם תלמיד</th>
                      <th>כיתה</th>
                      <th>בוקר</th>
                      <th>מחתים בוקר</th>
                      <th>ערב</th>
                      <th>מחתים ערב</th>
                      <th>אחר</th>
                      <th>מחתים אחר</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pivotReport(reportData).map((row, i) => (
                      <tr key={i}>
                        <td>{row.date}</td>
                        <td style={{ fontWeight: '600' }}>{row.name}</td>
                        <td>{row.grade}</td>
                        <td>
                          {row.morning
                            ? <span className={`badge ${row.morning.action === 'took' ? 'badge-green' : 'badge-red'}`}>{ACTION_LABELS[row.morning.action]}</span>
                            : <span style={{ color: 'var(--gray-300)' }}>—</span>}
                        </td>
                        <td style={{ fontSize: '13px', color: 'var(--gray-600)' }}>{row.morning?.staff || ''}</td>
                        <td>
                          {row.evening
                            ? <span className={`badge ${row.evening.action === 'took' ? 'badge-green' : 'badge-red'}`}>{ACTION_LABELS[row.evening.action]}</span>
                            : <span style={{ color: 'var(--gray-300)' }}>—</span>}
                        </td>
                        <td style={{ fontSize: '13px', color: 'var(--gray-600)' }}>{row.evening?.staff || ''}</td>
                        <td>
                          {row.other
                            ? <span className={`badge ${row.other.action === 'took' ? 'badge-green' : 'badge-red'}`}>{ACTION_LABELS[row.other.action]}</span>
                            : <span style={{ color: 'var(--gray-300)' }}>—</span>}
                        </td>
                        <td style={{ fontSize: '13px', color: 'var(--gray-600)' }}>{row.other?.staff || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── Users ── */}
        {tab === 'users' && (
          usersLoading ? <div className="loading-center"><div className="spinner"/></div> : (
            <div className="student-list">
              {users.map(u => (
                <div key={u.id} className="student-card" style={{ opacity: u.active ? 1 : 0.5, cursor: 'default' }}>
                  <div>
                    <div className="student-name">{u.full_name}</div>
                    <div className="student-meta">@{u.username} · {u.last_login ? `כניסה אחרונה: ${u.last_login.split('T')[0]}` : 'טרם נכנס'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className={`badge ${u.role === 'admin' ? 'badge-orange' : 'badge-gray'}`}>
                      {u.role === 'admin' ? 'מנהל' : 'צוות'}
                    </span>
                    {u.id !== Number(user?.id) && (
                      <button className="btn btn-sm btn-outline" onClick={() => toggleUserRole(u)}>
                        {u.role === 'admin' ? 'הורד לצוות' : 'הפוך מנהל'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

      </div>
    </div>
  );
}
