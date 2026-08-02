import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getCategories, getProducts } from '../services/catalog';
import ProductGrid from '../components/ProductGrid';
import Seo from '../components/Seo';
import { useLiveCatalog } from '../hooks/useLiveCatalog';

// Products arrive a batch at a time as you scroll, up to PER_PAGE. Past that
// the list gets a real page break — endless scrolling makes the footer
// unreachable and loses your place when you come back from a product.
const BATCH = 12;
const PER_PAGE = 60;

const SORT_OPTIONS = [
  ['newest', 'Newest'],
  ['price_asc', 'Price: low to high'],
  ['price_desc', 'Price: high to low'],
  ['popular', 'Best selling'],
  ['reviewed', 'Most reviewed'],
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
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchInput, setSearchInput] = useState(q);
  const [tick, setTick] = useState(0);
  const sentinelRef = useRef(null);

  // Live sync: bump `tick` when the admin changes the catalog -> refetch.
  useLiveCatalog(() => setTick((t) => t + 1));

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, [tick]);

  // Where this page sits in the whole result set: page 2 starts at item 61.
  const offset = (page - 1) * PER_PAGE;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  // Fetch batch `n` (0-based) of the current page and append it.
  const fetchBatch = useCallback((n) => {
    const apiPage = Math.floor(offset / BATCH) + n + 1;
    return getProducts({ category, q, sort, page: apiPage, limit: BATCH })
      .then(({ items, meta: m }) => {
        setTotal(m.total || 0);
        setProducts((prev) => {
          if (n === 0) return items;
          // Guard against a duplicate append if two observer callbacks race.
          const seen = new Set(prev.map((p) => p._id));
          return [...prev, ...items.filter((p) => !seen.has(p._id))];
        });
      });
  }, [category, q, sort, offset]);

  // Filters or page changed — start over from the first batch.
  useEffect(() => {
    setLoading(true);
    setProducts([]);
    fetchBatch(0)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [fetchBatch, tick]);

  const shownOnPage = products.length;
  const remainingOnPage = Math.min(PER_PAGE, total - offset) - shownOnPage;
  const canLoadMore = remainingOnPage > 0;

  // Auto-load the next batch when the sentinel scrolls into view.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !canLoadMore || loading || loadingMore) return undefined;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setLoadingMore(true);
        fetchBatch(Math.ceil(shownOnPage / BATCH))
          .catch(() => {})
          .finally(() => setLoadingMore(false));
      },
      { rootMargin: '400px' }, // start fetching before it's actually on screen
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [canLoadMore, loading, loadingMore, shownOnPage, fetchBatch]);

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
        <p className="mt-1 text-sm text-gray-500">{total} product{total === 1 ? '' : 's'}</p>
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
            <>
              <ProductGrid products={products} columns="sm:grid-cols-2 xl:grid-cols-3" />

              {/* Scroll sentinel — sits below the grid and pulls the next batch */}
              {canLoadMore && (
                <div ref={sentinelRef} className="flex justify-center py-8">
                  <span className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
                    Loading more…
                  </span>
                </div>
              )}

              <p className="mt-6 text-center text-xs text-gray-400">
                Showing {offset + 1}–{offset + shownOnPage} of {total}
              </p>
            </>
          )}

          {/* Page break — only once this page's 60 are all on screen */}
          {pages > 1 && !canLoadMore && !loading && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => update({ page: String(page - 1) }, true)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-2 text-sm text-gray-600">Page {page} of {pages}</span>
              <button
                disabled={page >= pages}
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
