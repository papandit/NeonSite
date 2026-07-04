import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectIsAdmin } from '../store/authSlice';

// Guards ALL admin routes: requires a logged-in user with role 'admin'.
// Anyone else is sent to /login. (A non-admin never gets a token persisted
// here anyway — the login thunk rejects them.)
export default function AdminProtectedRoute() {
  const isAuthed = useSelector(selectIsAuthenticated);
  const isAdmin = useSelector(selectIsAdmin);
  const location = useLocation();

  if (!isAuthed || !isAdmin) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
