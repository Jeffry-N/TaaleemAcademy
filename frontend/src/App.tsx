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
import { LandingPage } from './pages/LandingPage';
import { StudentDashboardPage } from './pages/StudentDashboardPage';
import { AdminDashboardPage } from './pages/Admin/AdminDashboardPage';
import { InstructorDashboardPage } from './pages/Instructor/InstructorDashboardPage';
import { LessonViewerPage } from './pages/LessonViewerPage';
import { QuizExperiencePage } from './pages/QuizExperiencePage';
import { CertificateDetailPage } from './pages/CertificateDetailPage';
import { CategoryManagementPage } from './pages/Admin/CategoryManagementPage';
import { SettingsPage } from './pages/SettingsPage';
import { EnrollmentManagementPage } from './pages/Instructor/EnrollmentManagementPage';

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

const DashboardRoute = () => {
  const { user } = useAuth();
  
  if (user?.role === 'Admin') {
    return <AdminDashboardPage />;
  } else if (user?.role === 'Instructor') {
    return <InstructorDashboardPage />;
  } else {
    return <StudentDashboardPage />;
  }
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <RoleGuard roles={['Student','Instructor','Admin']}>
                <DashboardRoute />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
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
          path="/lessons/viewer"
          element={
            <ProtectedRoute>
              <RoleGuard roles={['Student','Instructor','Admin']}>
                <LessonViewerPage />
              </RoleGuard>
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
              <RoleGuard roles={['Student']}>
                <CertificatesPage />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/certificates/sample"
          element={
            <ProtectedRoute>
              <RoleGuard roles={['Student']}>
                <CertificateDetailPage />
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
        <Route
          path="/quiz/demo"
          element={
            <ProtectedRoute>
              <RoleGuard roles={['Student','Instructor','Admin']}>
                <QuizExperiencePage />
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
        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute>
              <RoleGuard roles={['Admin']}>
                <CategoryManagementPage />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <RoleGuard roles={['Student','Instructor','Admin']}>
                <SettingsPage />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/enrollments"
          element={
            <ProtectedRoute>
              <RoleGuard roles={['Instructor','Admin']}>
                <EnrollmentManagementPage />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
