import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const TYPE_LABELS = { morning: 'בוקר', evening: 'ערב', other: 'תאריך שנבחר' };
const TYPE_ICONS  = { morning: '🌅', evening: '🌙', other: '📅' };

export default function StudentSigningPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [grade] = useState(() => sessionStorage.getItem('selectedGrade') || '');
  const [signingType] = useState(() => sessionStorage.getItem('signingType') || '');
  const [signingDate] = useState(() => sessionStorage.getItem('signingDate') || '');

  const [students, setStudents] = useState([]);
  const [signatures, setSignatures] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalStudent, setModalStudent] = useState(null);
  const [action, setAction] = useState('');
  const [reason, setReason] = useState('');
  const [overrideMode, setOverrideMode] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!grade || !signingType || !signingDate) navigate('/grades');
  }, [grade, signingType, signingDate, navigate]);

  const loadData = useCallback(async () => {
    if (!grade || !signingType || !signingDate) return;
    try {
      setLoading(true);
      const [sRes, sigRes] = await Promise.all([
        api.get(`/students?grade=${grade}`),
        api.get(`/signatures?grade=${grade}&signing_type=${signingType}&date=${signingDate}`),
      ]);
      setStudents(sRes.data);
      const map = {};
      sigRes.data.forEach(s => { map[s.student_id] = s; });
      setSignatures(map);
    } catch {
      showToast('שגיאה בטעינת נתונים', 'error');
    } finally {
      setLoading(false);
    }
  }, [grade, signingType, signingDate]);

  useEffect(() => { loadData(); }, [loadData]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(''), 3500);
  };

  const openModal = (student) => {
    setModalStudent(student);
    setAction('');
    setReason('');
    setOverrideMode(false);
    setOverrideReason('');
    setModalError('');
  };

  const closeModal = () => {
    setModalStudent(null);
    setOverrideMode(false);
  };

  const handleSign = async () => {
    if (!action) { setModalError('נדרש לבחור פעולה'); return; }
    if (action === 'refused' && !reason.trim()) { setModalError('נדרשת סיבה לסירוב'); return; }
    if (overrideMode && !overrideReason.trim()) { setModalError('נדרשת סיבת עדכון'); return; }

    setSubmitting(true);
    setModalError('');
    try {
      await api.post('/signatures', {
        student_id: modalStudent.id,
        signing_type: signingType,
        signing_date: signingDate,
        action,
        reason: reason.trim() || undefined,
        override_reason: overrideMode ? overrideReason.trim() : undefined,
      });

      const sigRes = await api.get(`/signatures?grade=${grade}&signing_type=${signingType}&date=${signingDate}`);
      const map = {};
      sigRes.data.forEach(s => { map[s.student_id] = s; });
      setSignatures(map);

      const name = modalStudent.name;
      closeModal();
      showToast(`✓ ${name} הוחתם/ה בהצלחה`);
    } catch (err) {
      if (err.response?.data?.requiresOverride) {
        setOverrideMode(true);
        setModalError('קיימת כבר חתימה. ניתן לעדכן אותה עם סיבת עדכון.');
      } else {
        setModalError(err.response?.data?.error || 'שגיאה בשמירה');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = students.filter(s =>
    !search || s.name.includes(search)
  );

  const signedCount = Object.keys(signatures).length;
  const progress = students.length > 0 ? (signedCount / students.length) * 100 : 0;

  const dateDisplay = signingDate
    ? new Date(signingDate + 'T12:00:00').toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  if (!grade) return null;

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/signature-type')}>← חזרה</button>
        <div>
          <div className="page-title">כיתה {grade} {TYPE_ICONS[signingType]} {TYPE_LABELS[signingType]}</div>
          <div className="page-subtitle">{dateDisplay}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '15px', fontWeight: '700' }}>
          {signedCount}/{students.length}
        </div>
      </div>

      {toast && (
        <div className={`alert alert-${toast.type === 'error' ? 'error' : 'success'}`}
          style={{ margin: '12px 16px 0', borderRadius: 'var(--radius)' }}>
          {toast.msg}
        </div>
      )}

      <div className="page-content">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
          <span className="badge badge-blue">👤 {user?.full_name}</span>
          <span className="badge badge-gray">{TYPE_ICONS[signingType]} {TYPE_LABELS[signingType]}</span>
          <span className={`badge ${signedCount === students.length && students.length > 0 ? 'badge-green' : 'badge-orange'}`}>
            {signedCount === students.length && students.length > 0 ? '✓ הושלם' : `נותרו ${students.length - signedCount}`}
          </span>
        </div>

        <input
          className="form-input"
          type="text"
          placeholder="חיפוש תלמיד..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: '14px' }}
        />

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <div className="student-list">
            {filtered.map(student => {
              const sig = signatures[student.id];
              return (
                <div
                  key={student.id}
                  className={`student-card ${sig ? (sig.action === 'took' ? 'signed-took' : 'signed-refused') : ''}`}
                  onClick={() => openModal(student)}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="student-name">{student.name}</div>
                    {sig && (
                      <div className="student-meta" style={{ color: sig.action === 'took' ? 'var(--success)' : 'var(--danger)' }}>
                        {sig.action === 'took' ? '✓ לקח/ה' : '✗ סירב/ה'}
                        {sig.reason ? ` — ${sig.reason}` : ''}
                        {sig.is_override ? ' (עודכן)' : ''}
                      </div>
                    )}
                  </div>
                  <span className={`badge ${!sig ? 'badge-gray' : sig.action === 'took' ? 'badge-green' : 'badge-red'}`}
                    style={{ flexShrink: 0 }}>
                    {!sig ? 'טרם הוחתם' : sig.action === 'took' ? 'לקח/ה' : 'סירב/ה'}
                  </span>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-400)', fontSize: '15px' }}>
                לא נמצאו תלמידים
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sign Modal */}
      {modalStudent && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">החתמת {modalStudent.name}</div>

            {modalError && <div className="alert alert-error">{modalError}</div>}
            {overrideMode && (
              <div className="alert alert-warning">
                ⚠ קיימת כבר חתימה לתלמיד/ה זה. הזן/י סיבת עדכון לדריסה.
              </div>
            )}

            <div className="form-group">
              <div className="form-label" style={{ marginBottom: '12px' }}>בחר/י פעולה</div>
              <div className="grid-2">
                <button
                  className={`btn btn-lg ${action === 'took' ? 'btn-success' : 'btn-secondary'}`}
                  style={{ fontSize: '17px' }}
                  onClick={() => setAction('took')}
                >
                  ✓ לקח/ה
                </button>
                <button
                  className={`btn btn-lg ${action === 'refused' ? 'btn-danger' : 'btn-secondary'}`}
                  style={{ fontSize: '17px' }}
                  onClick={() => setAction('refused')}
                >
                  ✗ סירב/ה
                </button>
              </div>
            </div>

            {action && (
              <div className="form-group">
                <label className="form-label">
                  {action === 'refused' ? 'סיבה לסירוב (חובה)' : 'הערה (אופציונלי)'}
                </label>
                <textarea
                  className="form-input"
                  placeholder={action === 'refused' ? 'פרט/י את הסיבה לסירוב...' : 'הוסף/י הערה...'}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={2}
                />
              </div>
            )}

            {overrideMode && (
              <div className="form-group">
                <label className="form-label">סיבת עדכון (חובה)</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="הסבר/י מדוע את/ה מעדכנ/ת את החתימה"
                  value={overrideReason}
                  onChange={e => setOverrideReason(e.target.value)}
                />
              </div>
            )}

            <div className="grid-2" style={{ marginTop: '8px' }}>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleSign}
                disabled={submitting || !action}
              >
                {submitting ? 'שומר...' : 'שמור'}
              </button>
              <button className="btn btn-secondary btn-lg" onClick={closeModal}>
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
