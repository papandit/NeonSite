import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectIsAuthenticated, selectUser } from '../store/authSlice';
import { resetCart, selectCartCount } from '../store/cartSlice';

const navLinkClass = ({ isActive }) =>
  `px-3 py-2 text-sm font-medium rounded-md transition ${
    isActive ? 'text-indigo-700 bg-indigo-50' : 'text-gray-600 hover:text-gray-900'
  }`;

export default function StorefrontLayout() {
  const isAuthed = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const cartCount = useSelector(selectCartCount);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onLogout = () => {
    dispatch(logout());
    dispatch(resetCart());
    navigate('/');
  };

  return (
    <div className="min-h-full flex flex-col bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold">
              N
            </span>
            <span className="text-lg font-semibold">NameCraft</span>
          </Link>

          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/products" className={navLinkClass}>
              Shop
            </NavLink>
            <NavLink to="/cart" className={navLinkClass}>
              <span className="relative inline-flex items-center">
                Cart
                {cartCount > 0 && (
                  <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-xs font-medium text-white">
                    {cartCount}
                  </span>
                )}
              </span>
            </NavLink>
            {isAuthed ? (
              <>
                <NavLink to="/account" className={navLinkClass}>
                  My Account
                </NavLink>
                <span className="hidden sm:inline text-sm text-gray-400 px-2">
                  {user?.name}
                </span>
                <button
                  onClick={onLogout}
                  className="ml-1 px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navLinkClass}>
                  Login
                </NavLink>
                <Link
                  to="/register"
                  className="ml-1 px-3 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} NameCraft · Onewebmart</span>
          <span>Custom name plates, crafted to order.</span>
        </div>
      </footer>
    </div>
  );
}
