import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectUser } from '../store/authSlice';
import { resetCart } from '../store/cartSlice';

const NAV = [
  ['/account/orders', 'Orders', '🧾'],
  ['/account/addresses', 'Addresses', '📍'],
  ['/account/profile', 'Profile', '👤'],
];

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
    isActive
      ? 'bg-indigo-600 text-white shadow-sm'
      : 'border border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50'
  }`;

export default function AccountLayout() {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onLogout = () => {
    dispatch(logout());
    dispatch(resetCart());
    navigate('/');
  };

  return (
    <div className="flex-1">
      {/* Full-width header banner */}
      <div className="bg-linear-to-br from-indigo-600 to-indigo-500 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-12 sm:flex-row sm:items-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 font-display text-2xl font-semibold ring-2 ring-white/30">
            {(user?.name || 'U').charAt(0).toUpperCase()}
          </span>
          <div>
            <h1 className="font-display text-3xl font-medium sm:text-4xl">My Account</h1>
            <p className="mt-1 text-indigo-50">
              Welcome back, {user?.name}
              {user?.email && <span className="text-indigo-200"> · {user.email}</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Body — wide, modern */}
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-2 lg:sticky lg:top-24 lg:h-fit">
          {NAV.map(([to, label, icon]) => (
            <NavLink key={to} to={to} className={linkClass}>
              <span className="text-lg">{icon}</span>
              {label}
            </NavLink>
          ))}
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 transition hover:border-red-200 hover:bg-red-50"
          >
            <span className="text-lg">↩</span>
            Logout
          </button>
        </aside>

        <div className="min-h-[55vh]">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
