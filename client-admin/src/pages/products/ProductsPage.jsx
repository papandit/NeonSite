import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resource } from '../../services/resourceApi';
import { apiErrorMessage } from '../../services/api';
import { formatPaise } from '../../utils/money';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';

const products = resource('products');

export default function ProductsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await products.list({ q: query.trim() || undefined, limit: 200 });
      setRows(data);
      setError(null);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [query]);

  // Debounced: reload as the admin types in the search box.
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const onToggle = async (row) => {
    try { await products.toggle(row._id); await load(); }
    catch (err) { setError(apiErrorMessage(err)); }
  };
  const onDelete = async () => {
    setBusy(true);
    try { await products.remove(confirm._id); setConfirm(null); await load(); }
    catch (err) { setError(apiErrorMessage(err)); }
    finally { setBusy(false); }
  };

  const enabledPanels = (p) =>
    Object.entries(p.customizationConfig || {})
      .filter(([k, v]) => k !== 'textFields' && v?.enabled)
      .map(([k]) => k);

  const columns = [
    {
      key: 'image',
      header: '',
      render: (r) =>
        r.images?.[0] ? (
          <img src={r.images[0]} alt="" className="h-10 w-10 rounded object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded bg-slate-100 text-xs text-slate-400">—</div>
        ),
    },
    { key: 'name', header: 'Name', render: (r) => <span className="font-medium text-slate-900">{r.name}</span> },
    { key: 'category', header: 'Category', render: (r) => r.category?.name || '—' },
    { key: 'price', header: 'Base price', render: (r) => formatPaise(r.basePricePaise) },
    {
      key: 'panels',
      header: 'Panels',
      render: (r) => <span className="text-xs text-slate-500">{enabledPanels(r).join(', ') || '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${r.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
          {r.status}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Each product's customization panels are defined in the Product Builder."
        action={
          <button onClick={() => navigate('/products/new')} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            + New product
          </button>
        }
      />

      {error && <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {/* Search */}
      <div className="mb-4 relative max-w-sm">
        <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products by name…"
          className="w-full rounded-full border border-slate-300 py-2 pl-9 pr-9 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        {query && (
          <button onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">✕</button>
        )}
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        empty="No products yet."
        actions={(row) => (
          <div className="flex justify-end gap-2">
            <button onClick={() => navigate(`/products/${row._id}/edit`)} className="text-sm font-medium text-indigo-600 hover:underline">Edit</button>
            <button onClick={() => onToggle(row)} className="text-sm text-slate-500 hover:underline">
              {row.status === 'active' ? 'Hide' : 'Show'}
            </button>
            <button onClick={() => setConfirm(row)} className="text-sm text-red-600 hover:underline">Delete</button>
          </div>
        )}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        message={`Delete product "${confirm?.name}"?`}
        onConfirm={onDelete}
        onCancel={() => setConfirm(null)}
        busy={busy}
      />
    </div>
  );
}
