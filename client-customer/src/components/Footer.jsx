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

// key -> { label, inline SVG paths }. Every href comes from the admin's
// Settings > socials; there is no fallback URL on purpose. A generic
// "https://instagram.com" is worse than no icon at all — it looks like a link
// to our profile and lands you on a stranger's home page — so a channel with
// no URL set simply does not render.
const SOCIAL_DEFS = [
  ['instagram', 'Instagram', (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </>
  )],
  ['facebook', 'Facebook', (
    <path d="M14 8.5h2V5.5h-2.2C11.7 5.5 11 6.9 11 8.4V10H9v3h2v6h3v-6h2.2l.4-3H14V8.8c0-.2.1-.3.4-.3z" fill="currentColor" stroke="none" />
  )],
  ['whatsapp', 'WhatsApp', (
    <>
      <path d="M20 11.7a8 8 0 0 1-11.9 7L4 20l1.4-4a8 8 0 1 1 14.6-4.3z" />
      <path d="M9.2 9c.3-.7.6-.7.9-.7h.6c.2 0 .5 0 .7.5l.7 1.7c.1.3 0 .5-.1.7l-.4.5c-.1.2-.3.4-.1.7a6 6 0 0 0 2.8 2.4c.3.1.5.1.7-.1l.6-.7c.2-.2.4-.2.6-.1l1.6.8c.3.1.4.4.3.7-.2.7-1 1.4-1.8 1.4-1.6 0-4-1.2-5.5-3.2-1-1.3-1.6-2.6-1.6-3.6 0-.4 0-.7.2-1z" fill="currentColor" stroke="none" />
    </>
  )],
  ['google', 'Google Business', (
    <>
      <path d="M12 21s6.5-5.6 6.5-10a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21z" />
      <circle cx="12" cy="11" r="2.5" />
    </>
  )],
  ['website', 'Website', (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18z" />
    </>
  )],
  ['youtube', 'YouTube', (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="4" />
      <path d="M10.5 9.2l4.2 2.8-4.2 2.8z" fill="currentColor" stroke="none" />
    </>
  )],
  ['twitter', 'X', (
    <path d="M4 4l16 16M20 4L4 20" />
  )],
  ['pinterest', 'Pinterest', (
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
  const storeName = settings.storeName || 'Daxon';
  const about = settings.content?.footer?.about;
  const tagline = settings.content?.footer?.tagline;
  const socials = settings.socials || {};
  // Only channels with a real URL. WhatsApp is derived from the support phone
  // when no explicit link is set, since that is the number people message.
  const waFromPhone = settings.supportPhone
    ? `https://wa.me/${String(settings.supportPhone).replace(/[^0-9]/g, '')}`
    : '';
  const shownSocials = SOCIAL_DEFS
    .map(([key, label, paths]) => [key, label, paths, socials[key] || (key === 'whatsapp' ? waFromPhone : '')])
    .filter(([, , , href]) => href);
  const initial = storeName.charAt(0).toUpperCase();

  return (
    <footer className="bg-gray-900 text-gray-200">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            {/* Full wordmark logo stands alone; the name is the no-logo
                fallback. The mark is near-black, so `logo-on-dark` inverts it
                to white rather than propping it on a light chip. */}
            <Link to="/" className="flex items-center gap-2" aria-label={storeName}>
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt={storeName} className="logo-on-dark h-11 w-auto object-contain object-left" />
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
              <div className="mt-4 space-y-2 text-sm text-gray-400">
                {settings.supportEmail && (
                  <a href={`mailto:${settings.supportEmail}`} className="flex items-center gap-2 transition hover:text-indigo-400">
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3.5 6.5l8.5 6 8.5-6" />
                    </svg>
                    <span className="break-all">{settings.supportEmail}</span>
                  </a>
                )}
                {settings.supportPhone && (
                  // A phone number on a phone should dial; on WhatsApp it should
                  // open the chat — so it is a link, not plain text.
                  <a
                    href={waFromPhone || `tel:${settings.supportPhone}`}
                    target={waFromPhone ? '_blank' : undefined}
                    rel={waFromPhone ? 'noreferrer' : undefined}
                    className="flex items-center gap-2 transition hover:text-indigo-400"
                  >
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                      <path d="M5 4h3l1.5 4-2 1.5a12 12 0 0 0 5 5L14 12l4 1.5V17a2 2 0 0 1-2.2 2A14.5 14.5 0 0 1 3 6.2 2 2 0 0 1 5 4z" />
                    </svg>
                    {settings.supportPhone}
                  </a>
                )}
              </div>
            )}
            {shownSocials.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-3">
                {shownSocials.map(([key, label, paths, href]) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    title={label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-gray-300 transition hover:border-indigo-400 hover:text-indigo-400"
                  >
                    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      {paths}
                    </svg>
                  </a>
                ))}
              </div>
            )}
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
          <span>© {new Date().getFullYear()} {storeName}. All rights reserved.</span>
          <span className="text-center sm:text-right">
            {tagline}
            <span className="mx-2 hidden text-gray-600 sm:inline">·</span>
            <span className="mt-1 block sm:mt-0 sm:inline">
              Created by{' '}
              <a
                href="https://onewebmart.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gray-300 underline-offset-2 transition hover:text-indigo-400 hover:underline"
              >
                Onewebmart Solution
              </a>
            </span>
          </span>
        </div>
      </div>
    </footer>
  );
}
