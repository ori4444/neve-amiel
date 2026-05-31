import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useOnlineStatus } from './utils/useOnlineStatus';
import InstructorLoginPage from './pages/InstructorLoginPage';
import HomePage from './pages/HomePage';
import GradeSelectionPage from './pages/GradeSelectionPage';
import SignatureTypePage from './pages/SignatureTypePage';
import StudentSigningPage from './pages/StudentSigningPage';
import SummaryViewPage from './pages/SummaryViewPage';
import AttendanceSummaryPage from './pages/AttendanceSummaryPage';
import AddStudentPage from './pages/AddStudentPage';

function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return <div className="offline-banner">⚠ אין חיבור לאינטרנט — חלק מהפעולות לא יהיו זמינות</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <OfflineBanner />
      <Routes>
        <Route path="/" element={<InstructorLoginPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/grades" element={<GradeSelectionPage />} />
        <Route path="/signature-type" element={<SignatureTypePage />} />
        <Route path="/signing" element={<StudentSigningPage />} />
        <Route path="/summaries" element={<SummaryViewPage />} />
        <Route path="/attendance-report" element={<AttendanceSummaryPage />} />
        <Route path="/add-student" element={<AddStudentPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
