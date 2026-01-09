import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ReactElement } from 'react';

export const RoleGuard = ({ roles, children }: { roles: Array<'Student'|'Instructor'|'Admin'>; children: ReactElement }) => {
  const { user, initialized } = useAuth();
  if (!initialized) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role as any)) return <Navigate to="/" replace />;
  return children;
};
