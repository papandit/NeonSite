// Name Plate Studio dashboard — a professional overview: headline stats, quick
// actions, recent template previews, and the full library at a glance.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { resource } from '../../services/resourceApi';
import { NP_COLLECTIONS } from '../../config/nameplateCollections';
import { formatPaise } from '../../utils/money';
import Icon from '../../components/Icon';

const COLL_ICON = {
  categories: 'category', fonts: 'type', colors: 'droplet', elements: 'sparkle',
  icons: 'sparkle', shapes: 'square', materials: 'cube', sizes: 'ruler', backgrounds: 'image',
};

const QUICK = [
  { to: '/nameplate/templates', label: 'Templates', icon: 'layers', accent: 'text-indigo-600' },
  { to: '/nameplate/c/fonts', label: 'Fonts', icon: 'type', accent: 'text-amber-600' },
  { to: '/nameplate/c/colors', label: 'Colours', icon: 'droplet', accent: 'text-rose-600' },
  { to: '/nameplate/c/elements', label: 'Elements', icon: 'sparkle', accent: 'text-emerald-600' },
  { to: '/nameplate/c/categories', label: 'Categories', icon: 'category', accent: 'text-blue-600' },
  { to: '/nameplate/price-rules', label: 'Price rules', icon: 'coupon', accent: 'text-purple-600' },
];

export default function NpDashboardPage() {
  const [counts, setCounts] = useState({});
  const [recent, setRecent] = useState([]);
  const [templateTotal, setTemplateTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all(NP_COLLECTIONS.map((c) => resource(`nameplate/${c.key}`).list({ limit: 1 }).then((r) => [c.key, r.meta?.total ?? 0]).catch(() => [c.key, 0])))
      .then((pairs) => { if (!cancelled) setCounts(Object.fromEntries(pairs)); });
    resource('nameplate/templates').list({ limit: 8, sort: '-createdAt' })
      .then((r) => { if (!cancelled) { setRecent(r.data); setTemplateTotal(r.meta?.total ?? r.data.length); } })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const HERO_STATS = [
    { label: 'Templates', value: templateTotal, icon: 'layers' },
    { label: 'Categories', value: counts.categories, icon: 'category' },
    { label: 'Fonts', value: counts.fonts, icon: 'type' },
    { label: 'Elements', value: counts.elements, icon: 'sparkle' },
  ];

  return (
    <div>
      {/* Hero */}
      <div className="overflow-hidden rounded-2xl bg-linear-to-br from-slate-900 to-slate-800 p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-amber-300">Name Plate Studio</div>
            <h1 className="mt-1 font-display text-3xl font-semibold text-white!">Design studio overview</h1>
            <p className="mt-1 max-w-xl text-sm text-white/70">A fully dynamic, Canva-style name-plate designer — every template, field, font and price is admin-controlled.</p>
          </div>
          <Link to="/nameplate/templates/new" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900! shadow hover:bg-slate-100">+ New template</Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {HERO_STATS.map((s) => (
            <div key={s.label} className="rounded-xl bg-white/10 p-4 backdrop-blur">
              <div className="flex items-center gap-2 text-white/70"><Icon name={s.icon} className="h-4 w-4" /><span className="text-xs">{s.label}</span></div>
              <div className="mt-1 text-2xl font-bold text-white!">{s.value ?? '—'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">Quick access</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {QUICK.map((a) => (
          <Link key={a.to} to={a.to} className="group flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
            <span className={`${a.accent} transition group-hover:scale-110`}><Icon name={a.icon} className="h-6 w-6" /></span>
            <span className="text-xs font-medium text-slate-600">{a.label}</span>
          </Link>
        ))}
      </div>

      {/* Recent templates */}
      <div className="mb-3 mt-8 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Recent templates</h2>
        <Link to="/nameplate/templates" className="text-sm font-medium text-indigo-600 hover:underline">View all</Link>
      </div>
      {recent.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">
          No templates yet. <Link to="/nameplate/templates/new" className="font-medium text-indigo-600 hover:underline">Create your first →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {recent.map((t) => (
            <Link key={t._id} to={`/nameplate/templates/${t._id}`} className="group overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:shadow-md">
              <div className="aspect-video overflow-hidden bg-slate-100">
                {(t.previewImageUrl || t.basePlateImageUrl) ? (
                  <img src={t.previewImageUrl || t.basePlateImageUrl} alt={t.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">No preview</div>
                )}
              </div>
              <div className="p-2.5">
                <div className="truncate text-xs font-semibold text-slate-900">{t.name}</div>
                <div className="mt-0.5 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="truncate">{t.category?.name || '—'}</span>
                  <span className="shrink-0 font-medium text-slate-600">{formatPaise(t.basePricePaise)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Library at a glance */}
      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">Library</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {NP_COLLECTIONS.map((c) => (
          <Link key={c.key} to={`/nameplate/c/${c.key}`} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-indigo-200 hover:shadow-sm">
            <span className="text-slate-400"><Icon name={COLL_ICON[c.key] || 'dot'} className="h-5 w-5" /></span>
            <div>
              <div className="text-lg font-bold text-slate-900">{counts[c.key] ?? '—'}</div>
              <div className="text-xs text-slate-500">{c.label}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
