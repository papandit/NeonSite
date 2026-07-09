// Name Plate gallery — browse admin-published templates by category, open one
// in the designer. Everything (templates + categories) is admin-controlled.

import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getNpCategories, getNpTemplates } from '../services/nameplate';
import { formatPaise } from '../utils/money';
import Seo from '../components/Seo';

export default function NamePlatesPage() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || '';
  const [cats, setCats] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getNpCategories().then(setCats).catch(() => {}); }, []);
  useEffect(() => {
    setLoading(true);
    getNpTemplates(category ? { category } : {})
      .then(setTemplates)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Seo title="Custom Name Plates" description="Design your own personalized name plate — choose a template and customize every detail." path="/nameplates" />
      <div className="text-center">
        <h1 className="font-display text-3xl font-medium sm:text-4xl">Custom Name Plates</h1>
        <p className="mt-2 text-gray-500">Pick a template and make it yours — live preview, crafted to order.</p>
      </div>

      {/* Category filter */}
      {cats.length > 0 && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => setParams({})} className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${!category ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>All</button>
          {cats.map((c) => (
            <button key={c._id} onClick={() => setParams({ category: c.slug })} className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${category === c.slug ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>{c.name}</button>
          ))}
        </div>
      )}

      <div className="mt-8">
        {loading ? (
          <p className="text-center text-sm text-gray-400">Loading templates…</p>
        ) : templates.length === 0 ? (
          <p className="text-center text-sm text-gray-400">No templates published yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => (
              <Link key={t._id} to={`/nameplates/${t.slug}`} className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:shadow-md">
                <div className="aspect-video overflow-hidden bg-slate-50">
                  {(t.previewImageUrl || t.basePlateImageUrl) ? (
                    <img src={t.previewImageUrl || t.basePlateImageUrl} alt={t.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-400">No preview</div>
                  )}
                </div>
                <div className="p-4">
                  {t.category?.name && <span className="text-xs text-gray-400">{t.category.name}</span>}
                  <div className="mt-0.5 font-medium text-gray-900 group-hover:text-indigo-600">{t.name}</div>
                  <div className="mt-2 text-sm"><span className="text-gray-400">from </span><span className="font-semibold">{formatPaise(t.basePricePaise)}</span></div>
                  <span className="mt-3 inline-block rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white">Customize →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
