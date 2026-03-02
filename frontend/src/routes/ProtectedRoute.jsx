import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectCurrentUser } from '../features/auth/authSlice';

export default function ProtectedRoute({ children, requiredRole }) {
  const reduxAuthenticated = useSelector(selectIsAuthenticated);
  const reduxUser = useSelector(selectCurrentUser);
  const location = useLocation();

  // Read localStorage directly as the synchronous source of truth.
  // This covers the brief window in React 19 concurrent rendering where
  // Redux selectors haven't propagated to this component yet.
  const localToken = localStorage.getItem('accessToken');
  let localUser = null;
  try {
    const raw = localStorage.getItem('user');
    if (raw) localUser = JSON.parse(raw);
  } catch { /* ignore */ }

  const isAuthenticated = reduxAuthenticated || !!(localToken && localUser?.role);
  const user = reduxUser || localUser;
  const role = user?.role || 'attendee';

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && role !== requiredRole) {
    if (role === 'organizer') return <Navigate to="/dashboard" replace />;
    return <Navigate to="/attendee-dashboard" replace />;
  }

  return children;
}
