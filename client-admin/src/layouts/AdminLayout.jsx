import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectUser } from '../store/authSlice';
import { OPTION_COLLECTIONS } from '../config/optionCollections';

const linkClass = ({ isActive }) =>
  `block rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
  }`;

function NavGroup({ title, children }) {
  return (
    <div className="mt-4">
      <div className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export default function AdminLayout() {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onLogout = () => {
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-full flex bg-slate-100 text-slate-900">
      <aside className="w-60 shrink-0 bg-slate-900 text-white flex flex-col">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-slate-800">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-bold">N</span>
          <span className="font-semibold">NameCraft Admin</span>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>

          <NavGroup title="Operations">
            <NavLink to="/orders" className={linkClass}>Orders</NavLink>
          </NavGroup>

          <NavGroup title="Catalog">
            <NavLink to="/categories" className={linkClass}>Categories</NavLink>
            <NavLink to="/subcategories" className={linkClass}>Subcategories</NavLink>
            <NavLink to="/products" className={linkClass}>Products</NavLink>
          </NavGroup>

          <NavGroup title="Options">
            {OPTION_COLLECTIONS.map((c) => (
              <NavLink key={c.key} to={`/options/${c.key}`} className={linkClass}>
                {c.label}
              </NavLink>
            ))}
          </NavGroup>

          <NavGroup title="Store">
            <NavLink to="/coupons" className={linkClass}>Coupons</NavLink>
            <NavLink to="/banners" className={linkClass}>Banners</NavLink>
            <NavLink to="/settings" className={linkClass}>Settings</NavLink>
          </NavGroup>
        </nav>

        <div className="p-3 border-t border-slate-800">
          <div className="px-3 py-2 text-xs text-slate-400 truncate">{user?.email}</div>
          <button onClick={onLogout} className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6">
          <h1 className="text-sm font-medium text-slate-500">
            Signed in as <span className="text-slate-900">{user?.name}</span>
          </h1>
        </header>
        <main className="flex-1 p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
