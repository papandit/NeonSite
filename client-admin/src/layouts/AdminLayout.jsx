import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectUser } from '../store/authSlice';
import Icon from '../components/Icon';
import { toast } from '../lib/toast';

// Three separate verticals: plain E-commerce, Neon Studio, Name Plate Studio.
const GROUPS = [
  { title: null, items: [{ to: '/dashboard', label: 'Dashboard', icon: 'dashboard' }] },
  {
    title: 'E-commerce',
    items: [
      { to: '/orders', label: 'Orders', icon: 'orders' },
      { to: '/products', label: 'Products', icon: 'product' },
      { to: '/categories', label: 'Categories', icon: 'category' },
      { to: '/subcategories', label: 'Subcategories', icon: 'layers' },
      { to: '/coupons', label: 'Coupons', icon: 'coupon' },
      { to: '/banners', label: 'Banners', icon: 'banner' },
      { to: '/reviews', label: 'Reviews', icon: 'reviews' },
      { to: '/analytics', label: 'Analytics', icon: 'analytics' },
      { to: '/settings', label: 'Settings', icon: 'settings' },
    ],
  },
  {
    title: 'Neon Studio',
    items: [
      { to: '/neon', label: 'Neon Studio', icon: 'sparkle' },
    ],
  },
  {
    title: 'Name Plate Studio',
    items: [
      { to: '/nameplate/dashboard', label: 'Dashboard', icon: 'dashboard' },
      { to: '/nameplate/templates', label: 'Templates', icon: 'layers' },
      { to: '/nameplate/c/categories', label: 'Categories', icon: 'category' },
      { to: '/nameplate/c/fonts', label: 'Fonts', icon: 'type' },
      { to: '/nameplate/c/colors', label: 'Colors', icon: 'droplet' },
      { to: '/nameplate/c/elements', label: 'Elements', icon: 'sparkle' },
      // Hidden for now (kept for later — routes still work if visited directly):
      // { to: '/nameplate/c/icons', label: 'Icons', icon: 'sparkle' },
      // { to: '/nameplate/c/shapes', label: 'Shapes', icon: 'square' },
      // { to: '/nameplate/c/materials', label: 'Materials', icon: 'cube' },
      { to: '/nameplate/c/sizes', label: 'Sizes', icon: 'ruler' },
      { to: '/nameplate/c/backgrounds', label: 'Backgrounds', icon: 'image' },
      { to: '/nameplate/price-rules', label: 'Price Rules', icon: 'coupon' },
    ],
  },
];

const COLLAPSE_KEY = 'nc_admin_sidebar_collapsed';

export default function AdminLayout() {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === '1');

  const toggle = () => {
    setCollapsed((c) => {
      localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1');
      return !c;
    });
  };

  const onLogout = () => {
    dispatch(logout());
    toast.info('Signed out');
    navigate('/login', { replace: true });
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition ${
      collapsed ? 'justify-center' : ''
    } ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 text-slate-900">
      {/* Sidebar — full viewport height; only its nav scrolls */}
      <aside
        className={`${collapsed ? 'w-16' : 'w-64'} shrink-0 bg-slate-900 text-white flex flex-col transition-[width] duration-200`}
      >
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-800 px-3">
          {/* Wordmark logo — sits on a light plate because the mark is near-black.
              Collapsed rail shows the square icon instead. */}
          {collapsed ? (
            <img src="/favicon.svg" alt="Daxon" className="h-9 w-9 shrink-0 rounded-lg bg-white/95 object-contain p-1" />
          ) : (
            <img src="/daxon-logo.svg" alt="Daxon" className="h-9 w-auto min-w-0 flex-1 rounded-md bg-white/95 object-contain px-2 py-1" />
          )}
          <button
            onClick={toggle}
            title={collapsed ? 'Expand' : 'Collapse'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <Icon name="chevron" className={`h-5 w-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <nav className="nav-scroll flex-1 overflow-y-auto px-3 py-3">
          {GROUPS.map((group, gi) => (
            <div key={group.title || gi} className={gi > 0 ? 'mt-4' : ''}>
              {group.title && !collapsed && (
                <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {group.title}
                </div>
              )}
              {group.title && collapsed && gi > 0 && <div className="mx-2 mb-2 border-t border-slate-800" />}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink key={item.to} to={item.to} title={item.label} className={linkClass}>
                    <Icon name={item.icon} className="h-5 w-5 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-slate-800 p-2.5">
          <div className={`flex items-center ${collapsed ? 'flex-col gap-2' : 'justify-between'}`}>
            <span
              title={user?.name || user?.email}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white"
            >
              {(user?.name || 'A').charAt(0).toUpperCase()}
            </span>
            <button
              onClick={onLogout}
              title="Logout"
              aria-label="Logout"
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              <Icon name="logout" className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Content — scrolls independently of the sidebar */}
      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center border-b border-slate-200 bg-white px-6">
          <h1 className="text-sm font-medium text-slate-500">
            Signed in as <span className="text-slate-900">{user?.name}</span>
          </h1>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
