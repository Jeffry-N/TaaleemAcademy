import './App.css';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { CourseListPage } from './pages/CourseListPage';
import { LoginPage } from './pages/LoginPage';
import { CourseDetailsPage } from './pages/CourseDetailsPage';
import { useAuth } from './context/AuthContext';
import { Spinner } from './components/Spinner';
import type { ReactElement } from 'react';
import { RoleGuard } from './components/RoleGuard';
import { RegisterPage } from './pages/RegisterPage';
import { CertificatesPage } from './pages/CertificatesPage';
import { ProgressPage } from './pages/ProgressPage';
import { CourseManagerPage } from './pages/Instructor/CourseManagerPage';
import { CourseEditorPage } from './pages/Instructor/CourseEditorPage';
import { QuizBuilderPage } from './pages/Instructor/QuizBuilderPage';
import { UserManagementPage } from './pages/Admin/UserManagementPage';
import { QuizTakePage } from './pages/QuizTakePage';
import { AttemptsPage } from './pages/AttemptsPage';

const ProtectedRoute = ({ children }: { children: ReactElement }) => {
  const { user, initialized } = useAuth();
  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Spinner />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/courses"
          element={
            <ProtectedRoute>
              <CourseListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:id"
          element={
            <ProtectedRoute>
              <CourseDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/progress"
          element={
            <ProtectedRoute>
              <RoleGuard roles={['Student','Instructor','Admin']}>
                <ProgressPage />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/certificates"
          element={
            <ProtectedRoute>
              <RoleGuard roles={['Student','Instructor','Admin']}>
                <CertificatesPage />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/attempts"
          element={
            <ProtectedRoute>
              <RoleGuard roles={['Student','Instructor','Admin']}>
                <AttemptsPage />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz/:quizId/take"
          element={
            <ProtectedRoute>
              <RoleGuard roles={['Student','Instructor','Admin']}>
                <QuizTakePage />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        {/* Instructor */}
        <Route
          path="/instructor/courses"
          element={
            <ProtectedRoute>
              <RoleGuard roles={['Instructor','Admin']}>
                <CourseManagerPage />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/courses/new"
          element={
            <ProtectedRoute>
              <RoleGuard roles={['Instructor','Admin']}>
                <CourseEditorPage mode="create" />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/courses/:id/edit"
          element={
            <ProtectedRoute>
              <RoleGuard roles={['Instructor','Admin']}>
                <CourseEditorPage mode="edit" />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/quizzes"
          element={
            <ProtectedRoute>
              <RoleGuard roles={['Instructor','Admin']}>
                <QuizBuilderPage />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        {/* Admin */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <RoleGuard roles={['Admin']}>
                <UserManagementPage />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/courses" replace />} />
        <Route path="*" element={<Navigate to="/courses" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
