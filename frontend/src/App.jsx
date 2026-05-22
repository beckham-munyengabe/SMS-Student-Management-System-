import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import StudentsPage from './pages/StudentsPage';
import TeachersPage from './pages/TeachersPage';
import AttendancePage from './pages/AttendancePage';
import MarksPage from './pages/MarksPage';
import CoursesPage from './pages/CoursesPage';
import ReportsPage from './pages/ReportsPage';
import ProfilePage from './pages/ProfilePage';
import UsersPage from './pages/UsersPage';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen mesh-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-body">Loading EduSync...</p>
      </div>
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="students" element={
          <ProtectedRoute roles={['administrator', 'teacher']}>
            <StudentsPage />
          </ProtectedRoute>
        } />
        <Route path="teachers" element={
          <ProtectedRoute roles={['administrator']}>
            <TeachersPage />
          </ProtectedRoute>
        } />
        <Route path="users" element={
          <ProtectedRoute roles={['administrator']}>
            <UsersPage />
          </ProtectedRoute>
        } />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="marks" element={<MarksPage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="reports" element={
          <ProtectedRoute roles={['administrator', 'teacher']}>
            <ReportsPage />
          </ProtectedRoute>
        } />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a2035',
              color: '#e2e8f0',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: '14px'
            },
            success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
