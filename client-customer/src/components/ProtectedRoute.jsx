import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../store/authSlice';

// Guards customer account routes: requires a logged-in user. Redirects to
// /login, remembering where the user was headed.
export default function ProtectedRoute() {
  const isAuthed = useSelector(selectIsAuthenticated);
  const location = useLocation();

  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
