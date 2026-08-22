// The trail back up. Every page below the home page gets one, so there is
// always a way out that does not depend on the browser's back button — which
// is unreliable after a redirect (checkout, login) and invisible on a phone in
// standalone mode.
//
// Pass `items` as [{ label, to }]; the last entry is the current page and
// renders as plain text, not a link.
//
// On a phone the full trail rarely fits, so the crumbs collapse to a single
// "Back to <parent>" control. That keeps the useful half — going up one level
// — rather than shrinking the whole path until none of it is tappable.

import { Link } from 'react-router-dom';

function Chevron({ dark }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 shrink-0 ${dark ? "text-white/25" : "text-gray-300"}`} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export default function Breadcrumbs({ items = [], className = '', dark = false }) {
  const trail = [{ label: 'Home', to: '/' }, ...items];
  if (trail.length < 2) return null;

  const parent = trail[trail.length - 2];
  const current = trail[trail.length - 1];

  return (
    <nav aria-label="Breadcrumb" className={`mb-5 ${className}`}>
      {/* Phone: one tap back up a level */}
      <Link
        to={parent.to || '/'}
        className={`inline-flex items-center gap-1.5 text-sm font-medium transition sm:hidden ${dark ? "text-indigo-300 hover:text-indigo-200" : "text-indigo-600 hover:text-indigo-700"}`}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M11 18l-6-6 6-6" />
        </svg>
        Back to {parent.label}
      </Link>

      {/* Tablet and up: the full trail */}
      <ol className={`hidden flex-wrap items-center gap-1.5 text-sm sm:flex ${dark ? "text-slate-400" : "text-gray-500"}`}>
        {trail.map((c, i) => {
          const last = i === trail.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1.5">
              {i > 0 && <Chevron dark={dark} />}
              {last || !c.to ? (
                <span className={`max-w-[42ch] truncate font-medium ${dark ? "text-white" : "text-gray-900"}`} aria-current={last ? 'page' : undefined}>
                  {c.label}
                </span>
              ) : (
                <Link to={c.to} className={`transition ${dark ? "hover:text-indigo-300" : "hover:text-indigo-600"}`}>{c.label}</Link>
              )}
            </li>
          );
        })}
      </ol>
      <span className="sr-only">Current page: {current.label}</span>
    </nav>
  );
}
