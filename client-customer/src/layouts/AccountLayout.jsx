import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { logout, selectUser } from '../store/authSlice';
import { resetCart } from '../store/cartSlice';
import { toast } from '../lib/toast';

const NAV = [
  ['/account/orders', 'Orders', '🧾'],
  ['/account/addresses', 'Addresses', '📍'],
  ['/account/profile', 'Profile', '👤'],
];

const linkClass = ({ isActive }) =>
  `group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
    isActive
      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
      : 'border border-gray-200/80 bg-white/80 text-gray-700 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-sm'
  }`;

export default function AccountLayout() {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onLogout = () => {
    dispatch(logout());
    dispatch(resetCart());
    toast.info('Signed out');
    navigate('/');
  };

  return (
    <div className="flex-1">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Modern light hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-linear-to-br from-indigo-50 via-white to-amber-50 px-6 py-10 shadow-sm sm:px-10"
        >
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-indigo-200/50 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/4 h-56 w-56 rounded-full bg-amber-200/50 blur-3xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 font-display text-2xl font-semibold text-white shadow-lg shadow-indigo-600/25 ring-4 ring-white">
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </span>
            <div>
              <h1 className="font-display text-3xl font-medium text-gray-900 sm:text-4xl">My Account</h1>
              <p className="mt-1 text-gray-500">
                Welcome back, <span className="font-semibold text-gray-700">{user?.name}</span>
                {user?.email && <span className="text-gray-400"> · {user.email}</span>}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Body */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[250px_1fr]">
          <aside className="space-y-2 lg:sticky lg:top-24 lg:h-fit">
            {NAV.map(([to, label, icon]) => (
              <NavLink key={to} to={to} className={linkClass}>
                {({ isActive }) => (
                  <>
                    <span className={`flex h-8 w-8 items-center justify-center rounded-xl text-base ${isActive ? 'bg-white/20' : 'bg-gray-100'}`}>{icon}</span>
                    {label}
                  </>
                )}
              </NavLink>
            ))}
            <button
              onClick={onLogout}
              className="flex w-full items-center gap-3 rounded-2xl border border-gray-200/80 bg-white/80 px-4 py-3 text-sm font-semibold text-red-600 transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:shadow-sm"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-base">↩</span>
              Logout
            </button>
          </aside>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.08 }}
            className="min-h-[55vh]"
          >
            <Outlet />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
