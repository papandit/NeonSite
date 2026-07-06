import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectUser } from '../store/authSlice';
import { selectCartCount } from '../store/cartSlice';
import { getCategories } from '../services/catalog';
import { useLiveCatalog } from '../hooks/useLiveCatalog';
import Footer from '../components/Footer';
import ScrollProgress from '../components/ScrollProgress';
import ChatBot from '../components/ChatBot';

const navLinkClass = ({ isActive }) =>
  `px-3 py-2 text-sm font-semibold rounded-full transition ${
    isActive ? 'text-indigo-700 bg-indigo-50' : 'text-gray-600 hover:text-gray-900'
  }`;

export default function StorefrontLayout() {
  const isAuthed = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const cartCount = useSelector(selectCartCount);

  const [categories, setCategories] = useState([]);
  const loadCats = useCallback(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);
  useEffect(() => { loadCats(); }, [loadCats]);
  useLiveCatalog(loadCats); // dropdown updates when admin adds a category

  return (
    <div className="min-h-full flex flex-col bg-gray-50 text-gray-900">
      <ScrollProgress />
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
              <Link
                to="/account"
                title={user?.name ? `${user.name} — My Account` : 'My Account'}
                aria-label="My Account"
                className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 font-display text-sm font-semibold text-white ring-2 ring-transparent transition hover:ring-indigo-200"
              >
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </Link>
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

      <Footer categories={categories} />
      <ChatBot />
    </div>
  );
}
