import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getCategories, getProducts } from '../services/catalog';
import ProductGrid from '../components/ProductGrid';
import Seo from '../components/Seo';
import { useLiveCatalog } from '../hooks/useLiveCatalog';

const SORT_OPTIONS = [
  ['newest', 'Newest'],
  ['price_asc', 'Price: low to high'],
  ['price_desc', 'Price: high to low'],
  ['rating', 'Top rated'],
  ['name', 'Name (A–Z)'],
];

export default function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || '';
  const q = params.get('q') || '';
  const sort = params.get('sort') || 'newest';
  const page = parseInt(params.get('page') || '1', 10);

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(q);
  const [tick, setTick] = useState(0);

  // Live sync: bump `tick` when the admin changes the catalog -> refetch.
  useLiveCatalog(() => setTick((t) => t + 1));

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, [tick]);

  useEffect(() => {
    setLoading(true);
    getProducts({ category, q, sort, page, limit: 12 })
      .then(({ items, meta: m }) => {
        setProducts(items);
        setMeta(m);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [category, q, sort, page, tick]);

  // Merge params, always resetting to page 1 unless page itself changes.
  const update = (patch, keepPage = false) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    if (!keepPage) next.delete('page');
    setParams(next);
  };

  const submitSearch = (e) => {
    e.preventDefault();
    update({ q: searchInput });
  };

  const activeCategory = categories.find((c) => c.slug === category);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Seo
        title={activeCategory ? activeCategory.name : 'Shop custom name plates'}
        description="Browse and customize personalized name plates — wood, acrylic, brass and more."
        path="/products"
      />
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {activeCategory ? activeCategory.name : 'All products'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">{meta.total} product{meta.total === 1 ? '' : 's'}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        {/* Filter sidebar */}
        <aside className="space-y-6">
          <form onSubmit={submitSearch}>
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <div className="mt-1 flex gap-2">
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search…"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </form>

          <div>
            <h3 className="text-sm font-medium text-gray-700">Categories</h3>
            <ul className="mt-2 space-y-1 text-sm">
              <li>
                <button
                  onClick={() => update({ category: '' })}
                  className={`block w-full text-left ${!category ? 'font-semibold text-indigo-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  All categories
                </button>
              </li>
              {categories.map((c) => (
                <li key={c._id}>
                  <button
                    onClick={() => update({ category: c.slug })}
                    className={`block w-full text-left ${category === c.slug ? 'font-semibold text-indigo-600' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {(category || q) && (
            <button onClick={() => { setSearchInput(''); setParams(new URLSearchParams()); }} className="text-sm text-indigo-600 hover:underline">
              Clear filters
            </button>
          )}
        </aside>

        {/* Results */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {q && <>Results for “<span className="font-medium">{q}</span>”</>}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Sort:</label>
              <select
                value={sort}
                onChange={(e) => update({ sort: e.target.value })}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              >
                {SORT_OPTIONS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <p className="py-16 text-center text-gray-400">Loading products…</p>
          ) : products.length === 0 ? (
            <p className="py-16 text-center text-gray-400">No products match your filters.</p>
          ) : (
            <ProductGrid products={products} columns="sm:grid-cols-2 xl:grid-cols-3" />
          )}

          {/* Pagination */}
          {meta.pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => update({ page: String(page - 1) }, true)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-2 text-sm text-gray-600">Page {meta.page} of {meta.pages}</span>
              <button
                disabled={page >= meta.pages}
                onClick={() => update({ page: String(page + 1) }, true)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
