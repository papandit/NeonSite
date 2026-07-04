import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  login,
  clearAuthError,
  selectAuth,
  selectIsAdmin,
  selectIsAuthenticated,
} from '../store/authSlice';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status, error } = useSelector(selectAuth);
  const isAuthed = useSelector(selectIsAuthenticated);
  const isAdmin = useSelector(selectIsAdmin);

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register: field,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { email: '', password: '' } });

  useEffect(() => {
    if (isAuthed && isAdmin) navigate(from, { replace: true });
  }, [isAuthed, isAdmin, from, navigate]);

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const onSubmit = (values) => {
    dispatch(login(values));
  };

  return (
    <div className="min-h-full flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold">
            N
          </span>
          <span className="text-lg font-semibold">NameCraft Admin</span>
        </div>
        <h1 className="mt-6 text-xl font-bold">Sign in</h1>
        <p className="mt-1 text-sm text-slate-500">Admin access only.</p>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              autoComplete="email"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              {...field('email', { required: 'Email is required' })}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              {...field('password', { required: 'Password is required' })}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {status === 'loading' ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
