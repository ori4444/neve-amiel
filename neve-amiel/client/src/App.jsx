import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useOnlineStatus } from './utils/useOnlineStatus';
import LoginPage from './pages/LoginPage';
import GradeSelectionPage from './pages/GradeSelectionPage';
import SignatureTypePage from './pages/SignatureTypePage';
import StudentSigningPage from './pages/StudentSigningPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminStudents from './pages/AdminStudents';
import SummaryViewPage from './pages/SummaryViewPage';
import Sidebar from './components/Sidebar';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-full"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/grades" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/grades" replace /> : <LoginPage />} />
      <Route path="/grades" element={<ProtectedRoute><GradeSelectionPage /></ProtectedRoute>} />
      <Route path="/signature-type" element={<ProtectedRoute><SignatureTypePage /></ProtectedRoute>} />
      <Route path="/signing" element={<ProtectedRoute><StudentSigningPage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/students" element={<ProtectedRoute adminOnly><AdminStudents /></ProtectedRoute>} />
      <Route path="/summaries" element={<ProtectedRoute><SummaryViewPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return <div className="offline-banner">⚠ אין חיבור לאינטרנט — חלק מהפעולות לא יהיו זמינות</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OfflineBanner />
        <AppRoutes />
        <Sidebar />
      </AuthProvider>
    </BrowserRouter>
  );
}
