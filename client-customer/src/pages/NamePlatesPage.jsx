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

      {/* Category selection — circular tiles (centres when they fit, scrolls when not) */}
      {cats.length > 0 && (
        <div className="mx-auto mt-8 flex w-fit max-w-full gap-4 overflow-x-auto px-2 py-4 sm:gap-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[{ _id: '__all', name: 'All', slug: '' }, ...cats].map((c) => {
            const active = c.slug ? category === c.slug : !category;
            const img = c.meta?.image;
            return (
              <button
                key={c._id}
                type="button"
                onClick={() => setParams(c.slug ? { category: c.slug } : {})}
                className="group flex w-24 shrink-0 flex-col items-center gap-2.5 text-center sm:w-28"
              >
                <span className={`flex aspect-square w-full items-center justify-center overflow-hidden rounded-full transition duration-300 group-hover:-translate-y-1 ${active ? 'shadow-lg ring-2 ring-indigo-500' : 'shadow-sm ring-1 ring-gray-200 group-hover:ring-indigo-300'}`}>
                  {img ? (
                    <img src={img} alt={c.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                  ) : (
                    <span className={`flex h-full w-full items-center justify-center font-display text-2xl font-semibold sm:text-3xl ${active ? 'bg-linear-to-br from-indigo-500 to-orange-400 text-white' : 'bg-linear-to-br from-orange-50 via-white to-amber-50 text-indigo-500'}`}>
                      {c.name === 'All' ? '✦' : c.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </span>
                <span className={`line-clamp-2 min-h-[2.4em] text-[11px] font-semibold leading-tight transition sm:text-xs ${active ? 'text-indigo-600' : 'text-gray-600 group-hover:text-indigo-600'}`}>
                  {c.name}
                </span>
              </button>
            );
          })}
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
                  <div className="mt-2 flex items-baseline gap-2 text-sm">
                    <span className="text-gray-400">from </span>
                    <span className="font-semibold text-gray-900">{formatPaise(t.basePricePaise)}</span>
                    {t.compareAtPricePaise > t.basePricePaise && (
                      <>
                        <span className="text-gray-400 line-through">{formatPaise(t.compareAtPricePaise)}</span>
                        <span className="rounded-full bg-green-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {Math.round(((t.compareAtPricePaise - t.basePricePaise) / t.compareAtPricePaise) * 100)}% OFF
                        </span>
                      </>
                    )}
                  </div>
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
