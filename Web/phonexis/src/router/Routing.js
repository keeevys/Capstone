import { useEffect, useRef } from 'react';
import ProtectedRoute from './ProtectedRoute';

export const ROUTES = {
  login: '/login',
  register: '/register',
  forgotpassword: '/forgot-password',
  reset: '/reset-password',
  dashboard: '/dashboard',
  modules: '/modules',
  alphabet: '/modules/alphabet',
  vowels: '/modules/vowels',
  consonants: '/modules/consonants',
  cvc: '/modules/cvc',
  profile: '/profile',
  admin: '/admin',
  teacher: '/teacher',
};

const PATH_TO_VIEW = Object.entries(ROUTES).reduce((routes, [view, path]) => {
  routes[path] = view;
  return routes;
}, {});

const PUBLIC_VIEWS = new Set(['login', 'register', 'forgotpassword', 'reset']);

const getViewFromPath = () => {
  const path = window.location.pathname.replace(/\/$/, '') || '/login';
  return PATH_TO_VIEW[path] || 'login';
};

export default function Routing({ activeView, isAuthenticated, currentUser, onNavigate, children }) {
  const hasInitializedPath = useRef(false);
  const lastPath = useRef(null);

  useEffect(() => {
    const handlePopState = () => onNavigate(getViewFromPath());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [onNavigate]);

  useEffect(() => {
    if (!hasInitializedPath.current) {
      const requestedView = getViewFromPath();
      const canOpenRequestedView = isAuthenticated || PUBLIC_VIEWS.has(requestedView);
      onNavigate(canOpenRequestedView ? requestedView : 'login');
      hasInitializedPath.current = true;
      return;
    }

    const path = ROUTES[activeView] || ROUTES.login;
    if (lastPath.current === path) {
      return;
    }

    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    lastPath.current = path;
  }, [activeView, isAuthenticated, onNavigate]);

  const routeIsPublic = PUBLIC_VIEWS.has(activeView);
  return routeIsPublic ? children : (
    <ProtectedRoute
      onNavigate={onNavigate}
      user={currentUser}
      allowedRoles={activeView === 'admin' ? ['admin'] : activeView === 'teacher' ? ['teacher'] : []}
    >
      {children}
    </ProtectedRoute>
  );
}
