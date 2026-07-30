import { Link } from 'react-router-dom';
import { useSiteSettings } from '../context/SiteSettings';

const QUICK_LINKS = [
  ['About Us', '/p/about-us'],
  ['About Product', '/p/about-product'],
  ['Privacy Policy', '/p/privacy-policy'],
  ['Refund and Return Policy', '/p/refund-and-return-policy'],
  ['Shipping and Delivery', '/p/shipping-and-delivery'],
  ['Terms of Service Agreement', '/p/terms-of-service'],
  ['Contact Us', '/p/contact-us'],
];

const NAV_LINKS = [
  ['Home', '/'],
  ['Shop', '/products'],
  ['Cart', '/cart'],
  ['My Account', '/account'],
  ['Login', '/login'],
];

// key → { label, default href, inline SVG paths }. The href is overridden by the
// admin's Settings › socials when set.
const SOCIAL_DEFS = [
  ['instagram', 'Instagram', 'https://instagram.com', (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </>
  )],
  ['youtube', 'YouTube', 'https://youtube.com', (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="4" />
      <path d="M10.5 9.2l4.2 2.8-4.2 2.8z" fill="currentColor" stroke="none" />
    </>
  )],
  ['facebook', 'Facebook', 'https://facebook.com', (
    <path d="M14 8.5h2V5.5h-2.2C11.7 5.5 11 6.9 11 8.4V10H9v3h2v6h3v-6h2.2l.4-3H14V8.8c0-.2.1-.3.4-.3z" fill="currentColor" stroke="none" />
  )],
  ['twitter', 'X', 'https://x.com', (
    <path d="M4 4l16 16M20 4L4 20" />
  )],
  ['pinterest', 'Pinterest', 'https://pinterest.com', (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 20l2-8M11.5 12c0-2 4-2.5 4 .5 0 2-2 3.5-3.5 2.5" />
    </>
  )],
];

function FooterLink({ to, children }) {
  return (
    <Link to={to} className="text-sm text-gray-300 transition hover:text-indigo-400">
      {children}
    </Link>
  );
}

export default function Footer({ categories = [] }) {
  const { settings } = useSiteSettings();
  const storeName = settings.storeName || 'OWM NameCraft Ecom';
  const about = settings.content?.footer?.about;
  const tagline = settings.content?.footer?.tagline;
  const socials = settings.socials || {};
  const initial = storeName.charAt(0).toUpperCase();

  return (
    <footer className="bg-gray-900 text-gray-200">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            {/* Full wordmark logo stands alone; the name is the no-logo fallback.
                The mark is near-black, so it sits on a light chip here. */}
            <Link to="/" className="flex items-center gap-2" aria-label={storeName}>
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt={storeName} className="h-12 w-auto max-w-48 rounded-xl bg-white/95 object-contain px-2 py-1" />
              ) : (
                <>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 font-display text-lg font-semibold text-white">
                    {initial}
                  </span>
                  <span className="font-display text-lg font-medium text-white">{storeName}</span>
                </>
              )}
            </Link>
            <p className="mt-4 max-w-xs text-sm text-gray-400">{about}</p>
            {(settings.supportEmail || settings.supportPhone) && (
              <div className="mt-4 space-y-1 text-sm text-gray-400">
                {settings.supportEmail && (
                  <a href={`mailto:${settings.supportEmail}`} className="block transition hover:text-indigo-400">
                    {settings.supportEmail}
                  </a>
                )}
                {settings.supportPhone && <div>{settings.supportPhone}</div>}
              </div>
            )}
            <div className="mt-5 flex gap-3">
              {SOCIAL_DEFS.map(([key, label, defaultHref, paths]) => (
                <a
                  key={key}
                  href={socials[key] || defaultHref}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-gray-300 transition hover:border-indigo-400 hover:text-indigo-400"
                >
                  <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    {paths}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-display text-lg font-medium text-white">Quick links</h3>
            <ul className="mt-4 space-y-2.5">
              {QUICK_LINKS.map(([label, to]) => (
                <li key={label}><FooterLink to={to}>{label}</FooterLink></li>
              ))}
            </ul>
          </div>

          {/* Navigate (our navbar list) */}
          <div>
            <h3 className="font-display text-lg font-medium text-white">Navigate</h3>
            <ul className="mt-4 space-y-2.5">
              {NAV_LINKS.map(([label, to]) => (
                <li key={label}><FooterLink to={to}>{label}</FooterLink></li>
              ))}
            </ul>
          </div>

          {/* Shop by category (live) */}
          <div>
            <h3 className="font-display text-lg font-medium text-white">Shop by category</h3>
            <ul className="mt-4 space-y-2.5">
              {categories.length === 0 ? (
                <li className="text-sm text-gray-500">Coming soon</li>
              ) : (
                categories.slice(0, 6).map((cat) => (
                  <li key={cat._id}>
                    <FooterLink to={`/products?category=${cat.slug}`}>{cat.name}</FooterLink>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-5 text-sm text-gray-400 sm:flex-row">
          <span>© {new Date().getFullYear()} {storeName} · Onewebmart</span>
          <span>{tagline}</span>
        </div>
      </div>
    </footer>
  );
}
