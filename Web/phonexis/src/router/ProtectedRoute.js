import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = [], onNavigate, user }) {
  const { isAuthenticated, isLoading } = useAuth();
  const role = String(user?.role || user?.user_metadata?.role || '').toLowerCase();
  const hasAllowedRole = allowedRoles.length === 0 || !user || allowedRoles.includes(role);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      onNavigate('login');
    }
    if (!isLoading && isAuthenticated && user && !hasAllowedRole) {
      onNavigate('dashboard');
    }
  }, [hasAllowedRole, isAuthenticated, isLoading, onNavigate, user]);

  if (isLoading || !isAuthenticated || !hasAllowedRole) {
    return null;
  }

  return children;
}
