// Name Plate Studio dashboard — quick counts + shortcuts.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { resource } from '../../services/resourceApi';
import { NP_COLLECTIONS } from '../../config/nameplateCollections';
import PageHeader from '../../components/PageHeader';

export default function NpDashboardPage() {
  const [counts, setCounts] = useState({});

  useEffect(() => {
    let cancelled = false;
    const keys = ['templates', ...NP_COLLECTIONS.map((c) => c.key)];
    Promise.all(keys.map((k) => resource(`nameplate/${k}`).list({ limit: 1 }).then((r) => [k, r.meta?.total ?? 0]).catch(() => [k, 0])))
      .then((pairs) => { if (!cancelled) setCounts(Object.fromEntries(pairs)); });
    return () => { cancelled = true; };
  }, []);

  const tile = (to, label, count) => (
    <Link key={to} to={to} className="rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
      <div className="text-2xl font-bold text-slate-900">{count ?? '—'}</div>
      <div className="mt-0.5 text-sm text-slate-500">{label}</div>
    </Link>
  );

  return (
    <div>
      <PageHeader title="Name Plate Studio" subtitle="A fully dynamic, Canva-style name-plate designer — everything below is admin-controlled." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tile('/nameplate/templates', 'Templates', counts.templates)}
        {NP_COLLECTIONS.map((c) => tile(`/nameplate/c/${c.key}`, c.label, counts[c.key]))}
        {tile('/nameplate/price-rules', 'Price rules', '⚙')}
      </div>
    </div>
  );
}
