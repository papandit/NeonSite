import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectUser } from '../store/authSlice';
import { selectCartCount } from '../store/cartSlice';
import { getCategories } from '../services/catalog';
import { useLiveCatalog } from '../hooks/useLiveCatalog';
import { useSiteSettings } from '../context/SiteSettings';
import Footer from '../components/Footer';
import ScrollProgress from '../components/ScrollProgress';
import ChatBot from '../components/ChatBot';

const navLinkClass = ({ isActive }) =>
  `px-3 py-2 text-sm font-semibold rounded-full transition ${
    isActive ? 'text-indigo-700 bg-indigo-50' : 'text-gray-600 hover:text-gray-900'
  }`;
const neonLinkClass = ({ isActive }) =>
  `px-3 py-2 text-sm font-bold rounded-full transition ${isActive ? 'text-indigo-700 bg-indigo-50' : 'text-indigo-600 hover:text-indigo-700'}`;

// Mobile menu row link.
const mobileLinkClass = ({ isActive }) =>
  `block rounded-lg px-3 py-2.5 text-base font-semibold transition ${
    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'
  }`;

function CartBadge({ count }) {
  return (
    <span className="relative inline-flex items-center">
      Cart
      {count > 0 && (
        <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-xs font-bold text-white">
          {count}
        </span>
      )}
    </span>
  );
}

export default function StorefrontLayout() {
  const isAuthed = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const cartCount = useSelector(selectCartCount);
  const { settings } = useSiteSettings();
  const storeName = settings.storeName || 'OWM NameCraft Ecom';
  const location = useLocation();

  const [categories, setCategories] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const loadCats = useCallback(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);
  useEffect(() => { loadCats(); }, [loadCats]);
  useLiveCatalog(loadCats); // dropdown updates when admin adds a category

  // Close the mobile menu on navigation.
  useEffect(() => { setMenuOpen(false); }, [location.pathname, location.search]);

  const Brand = (
    <Link to="/" className="flex min-w-0 items-center gap-2">
      {settings.logoUrl ? (
        <img src={settings.logoUrl} alt={storeName} className="h-9 w-9 shrink-0 rounded-lg object-cover" />
      ) : (
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white font-display text-lg font-semibold">
          {storeName.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="truncate font-display text-base font-medium tracking-tight text-gray-900 sm:text-xl">{storeName}</span>
    </Link>
  );

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-gray-50 text-gray-900">
      <ScrollProgress />
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-[#fffdf9]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4">
          {Brand}

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
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
            <NavLink to="/nameplates" className={navLinkClass}>Name Plates</NavLink>
            <NavLink to="/neon" className={neonLinkClass}>Neon ✨</NavLink>
            <NavLink to="/cart" className={navLinkClass}><CartBadge count={cartCount} /></NavLink>

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

          {/* Mobile cluster: cart + account + hamburger */}
          <div className="flex items-center gap-1 md:hidden">
            <Link to="/cart" aria-label="Cart" className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100">
              <svg className="h-5.5 w-5.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" /><path d="M2 3h2.2l2 12.4a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 7H6" /></svg>
              {cartCount > 0 && (
                <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">{cartCount}</span>
              )}
            </Link>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100"
            >
              {menuOpen ? (
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              ) : (
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        {menuOpen && (
          <div className="border-t border-gray-200 bg-[#fffdf9] md:hidden">
            <nav className="mx-auto max-w-6xl space-y-1 px-4 py-3">
              <NavLink to="/" end className={mobileLinkClass}>Home</NavLink>
              <NavLink to="/products" className={mobileLinkClass}>Shop</NavLink>
              <NavLink to="/nameplates" className={mobileLinkClass}>Name Plates</NavLink>
              <NavLink to="/neon" className={mobileLinkClass}>Neon ✨</NavLink>
              <NavLink to="/cart" className={mobileLinkClass}><CartBadge count={cartCount} /></NavLink>

              {categories.length > 0 && (
                <div className="pt-2">
                  <div className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Categories</div>
                  <div className="flex flex-wrap gap-1.5 px-3 pb-1">
                    {categories.map((cat) => (
                      <Link key={cat._id} to={`/products?category=${cat.slug}`} className="rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700">
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-2 border-t border-gray-100 pt-3">
                {isAuthed ? (
                  <NavLink to="/account" className={mobileLinkClass}>My Account</NavLink>
                ) : (
                  <div className="flex gap-2 px-1">
                    <NavLink to="/login" className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-center text-base font-semibold text-gray-700">Login</NavLink>
                    <NavLink to="/register" className="flex-1 rounded-lg bg-indigo-600 px-3 py-2.5 text-center text-base font-semibold text-white">Sign up</NavLink>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer categories={categories} />
      <ChatBot />
    </div>
  );
}
