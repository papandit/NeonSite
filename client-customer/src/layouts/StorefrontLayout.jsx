import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectIsAuthenticated, selectUser } from '../store/authSlice';
import { resetCart, selectCartCount } from '../store/cartSlice';
import { getCategories } from '../services/catalog';
import { useLiveCatalog } from '../hooks/useLiveCatalog';

const navLinkClass = ({ isActive }) =>
  `px-3 py-2 text-sm font-semibold rounded-full transition ${
    isActive ? 'text-indigo-700 bg-indigo-50' : 'text-gray-600 hover:text-gray-900'
  }`;

export default function StorefrontLayout() {
  const isAuthed = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const cartCount = useSelector(selectCartCount);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const loadCats = useCallback(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);
  useEffect(() => { loadCats(); }, [loadCats]);
  useLiveCatalog(loadCats); // dropdown updates when admin adds a category

  const onLogout = () => {
    dispatch(logout());
    dispatch(resetCart());
    navigate('/');
  };

  return (
    <div className="min-h-full flex flex-col bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-[#fffdf9]/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white font-display text-lg font-semibold">
              O
            </span>
            <span className="font-display text-xl font-medium tracking-tight text-gray-900">OWM NameCraft Ecom</span>
          </Link>

          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={navLinkClass}>Home</NavLink>

            {/* Categories dropdown (with subcategories) */}
            <div className="relative group">
              <Link to="/products" className="flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold text-gray-600 transition hover:text-gray-900">
                Categories
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
              </Link>
              {categories.length > 0 && (
                <div className="invisible absolute left-1/2 top-full z-50 mt-1 w-72 -translate-x-1/2 rounded-2xl border border-gray-200 bg-white p-3 opacity-0 shadow-xl transition duration-150 group-hover:visible group-hover:opacity-100">
                  <div className="grid gap-1">
                    {categories.map((cat) => (
                      <div key={cat._id} className="rounded-lg p-1">
                        <Link to={`/products?category=${cat.slug}`} className="block rounded-lg px-2 py-1.5 text-sm font-semibold text-gray-800 hover:bg-indigo-50 hover:text-indigo-700">
                          {cat.name}
                        </Link>
                        {cat.subCategories?.length > 0 && (
                          <div className="mt-0.5 ml-2 flex flex-wrap gap-1">
                            {cat.subCategories.map((sc) => (
                              <Link key={sc._id} to={`/products?subcategory=${sc.slug}`} className="rounded-full bg-gray-50 px-2.5 py-0.5 text-xs text-gray-500 hover:bg-indigo-50 hover:text-indigo-700">
                                {sc.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <NavLink to="/products" className={navLinkClass}>Shop</NavLink>
            <NavLink to="/cart" className={navLinkClass}>
              <span className="relative inline-flex items-center">
                Cart
                {cartCount > 0 && (
                  <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-xs font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </span>
            </NavLink>

            {isAuthed ? (
              <>
                <NavLink to="/account" className={navLinkClass}>My Account</NavLink>
                <span className="hidden sm:inline px-2 text-sm text-gray-400">{user?.name}</span>
                <button onClick={onLogout} className="ml-1 rounded-full px-3 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900">
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navLinkClass}>Login</NavLink>
                <Link to="/register" className="ml-1 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
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
          <span>© {new Date().getFullYear()} OWM NameCraft Ecom · Onewebmart</span>
          <span>Custom name plates, crafted to order.</span>
        </div>
      </footer>
    </div>
  );
}
