import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';

export default function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user } = useSelector((s: RootState) => s.auth);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (roles && user && !roles.some(r => user.roles.includes(r))) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
