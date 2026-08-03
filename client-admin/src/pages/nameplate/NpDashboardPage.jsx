// Name Plate Studio dashboard — headline stats, quick actions, recent template
// previews and the library at a glance. Collections flagged `hidden` in the
// config (shapes, materials) are left out.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { resource } from '../../services/resourceApi';
import { NP_COLLECTIONS } from '../../config/nameplateCollections';
import { formatPaise } from '../../utils/money';
import Icon from '../../components/Icon';

const VISIBLE = NP_COLLECTIONS.filter((c) => !c.hidden);

const COLL_ICON = {
  categories: 'category', fonts: 'type', colors: 'droplet', elements: 'sparkle',
  icons: 'sparkle', sizes: 'ruler', backgrounds: 'image',
};

const QUICK = [
  { to: '/nameplate/templates', label: 'Templates', icon: 'layers', chip: 'bg-indigo-50 text-indigo-600' },
  { to: '/nameplate/c/fonts', label: 'Fonts', icon: 'type', chip: 'bg-amber-50 text-amber-600' },
  { to: '/nameplate/c/colors', label: 'Colours', icon: 'droplet', chip: 'bg-rose-50 text-rose-600' },
  { to: '/nameplate/c/elements', label: 'Elements', icon: 'sparkle', chip: 'bg-emerald-50 text-emerald-600' },
  { to: '/nameplate/c/categories', label: 'Categories', icon: 'category', chip: 'bg-blue-50 text-blue-600' },
  { to: '/nameplate/price-rules', label: 'Price rules', icon: 'coupon', chip: 'bg-purple-50 text-purple-600' },
];

function SectionTitle({ children, action }) {
  return (
    <div className="mb-3 mt-10 flex items-end justify-between">
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{children}</h2>
      {action}
    </div>
  );
}

export default function NpDashboardPage() {
  const [counts, setCounts] = useState({});
  const [recent, setRecent] = useState([]);
  const [templateTotal, setTemplateTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all(VISIBLE.map((c) => resource(`nameplate/${c.key}`).list({ limit: 1 }).then((r) => [c.key, r.meta?.total ?? 0]).catch(() => [c.key, 0])))
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
      <div
        className="relative overflow-hidden rounded-3xl p-7 text-white shadow-xl sm:p-9"
        // A flat near-black panel read as muddy; a deep teal gradient carries
        // the brand and gives the stat cards something to sit on.
        style={{ background: 'linear-gradient(135deg, #00584e 0%, #0b3f39 45%, #14211f 100%)' }}
      >
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-indigo-400/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/4 h-72 w-72 rounded-full bg-gold-500/15 blur-3xl" />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-400">Name Plate Studio</div>
            <h1 className="mt-2 font-display text-3xl font-medium text-white! sm:text-4xl">Design studio overview</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">
              A fully dynamic, Canva-style name-plate designer — every template, field, font and price is admin-controlled.
            </p>
          </div>
          <Link
            to="/nameplate/templates/new"
            className="rounded-full bg-gold-500 px-5 py-2.5 text-sm font-semibold text-slate-900! shadow-lg transition hover:-translate-y-0.5 hover:bg-gold-400"
          >
            + New template
          </Link>
        </div>

        <div className="relative mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {HERO_STATS.map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur transition hover:border-white/30 hover:bg-white/15">
              <div className="flex items-center gap-2 text-white/70">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10"><Icon name={s.icon} className="h-4 w-4" /></span>
                <span className="text-xs font-medium">{s.label}</span>
              </div>
              <div className="mt-2 font-display text-3xl font-semibold text-white!">{s.value ?? '—'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <SectionTitle>Quick access</SectionTitle>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {QUICK.map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="group flex flex-col items-center gap-2.5 rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
          >
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${a.chip} transition group-hover:scale-110`}>
              <Icon name={a.icon} className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900">{a.label}</span>
          </Link>
        ))}
      </div>

      {/* Recent templates */}
      <SectionTitle action={<Link to="/nameplate/templates" className="text-sm font-medium text-indigo-600 hover:underline">View all</Link>}>
        Recent templates
      </SectionTitle>
      {recent.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-400">
          No templates yet. <Link to="/nameplate/templates/new" className="font-medium text-indigo-600 hover:underline">Create your first →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {recent.map((t) => (
            <Link
              key={t._id}
              to={`/nameplate/templates/${t._id}`}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
            >
              <div className="relative aspect-video overflow-hidden bg-slate-100">
                {(t.previewImageUrl || t.basePlateImageUrl) ? (
                  <img src={t.previewImageUrl || t.basePlateImageUrl} alt={t.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">No preview</div>
                )}
                <span className="absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-black/25 to-transparent opacity-0 transition group-hover:opacity-100" />
              </div>
              <div className="p-3">
                <div className="truncate text-sm font-semibold text-slate-900">{t.name}</div>
                <div className="mt-1 flex items-center justify-between gap-2 text-[11px]">
                  <span className="truncate rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">{t.category?.name || 'Uncategorised'}</span>
                  <span className="shrink-0 font-semibold text-slate-700">{formatPaise(t.basePricePaise)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Library at a glance */}
      <SectionTitle>Library</SectionTitle>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {VISIBLE.map((c) => (
          <Link
            key={c.key}
            to={`/nameplate/c/${c.key}`}
            className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition group-hover:bg-indigo-50 group-hover:text-indigo-600">
              <Icon name={COLL_ICON[c.key] || 'dot'} className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="font-display text-xl font-semibold text-slate-900">{counts[c.key] ?? '—'}</div>
              <div className="truncate text-xs text-slate-500">{c.label}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
