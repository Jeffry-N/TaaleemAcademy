import './App.css';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { CourseListPage } from './pages/CourseListPage';
import { LoginPage } from './pages/LoginPage';
import { CourseDetailsPage } from './pages/CourseDetailsPage';
import { useAuth } from './context/AuthContext';
import { Spinner } from './components/Spinner';
import type { ReactElement } from 'react';

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
        <Route path="/" element={<Navigate to="/courses" replace />} />
        <Route path="*" element={<Navigate to="/courses" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
