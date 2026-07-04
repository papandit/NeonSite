import { NavLink, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/authSlice';

const NAV = [
  ['/account/orders', 'Orders'],
  ['/account/addresses', 'Addresses'],
  ['/account/profile', 'Profile'],
];

const linkClass = ({ isActive }) =>
  `block rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
  }`;

export default function AccountLayout() {
  const user = useSelector(selectUser);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">My Account</h1>
      <p className="mt-1 text-sm text-gray-500">Hi {user?.name}</p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[200px_1fr]">
        <nav className="space-y-1">
          {NAV.map(([to, label]) => (
            <NavLink key={to} to={to} className={linkClass}>{label}</NavLink>
          ))}
        </nav>
        <div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
