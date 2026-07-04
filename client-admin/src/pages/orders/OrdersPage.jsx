import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminOrders } from '../../services/ops';
import { apiErrorMessage } from '../../services/api';
import { formatPaise } from '../../utils/money';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';

const STATUSES = ['pending', 'confirmed', 'design_review', 'approved', 'manufacturing', 'packed', 'shipped', 'delivered', 'cancelled'];

const STATUS_STYLE = {
  confirmed: 'bg-blue-50 text-blue-700', design_review: 'bg-amber-50 text-amber-700',
  approved: 'bg-indigo-50 text-indigo-700', manufacturing: 'bg-purple-50 text-purple-700',
  packed: 'bg-cyan-50 text-cyan-700', shipped: 'bg-teal-50 text-teal-700',
  delivered: 'bg-green-50 text-green-700', cancelled: 'bg-red-50 text-red-700', pending: 'bg-slate-100 text-slate-600',
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminOrders.list({ status: status || undefined, q: q || undefined, page, limit: 20 });
      setRows(res.data);
      setMeta(res.meta);
      setError(null);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [status, q, page]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { key: 'orderNumber', header: 'Order', render: (r) => <span className="font-medium text-slate-900">{r.orderNumber}</span> },
    { key: 'customer', header: 'Customer', render: (r) => <div><div>{r.userName}</div><div className="text-xs text-slate-400">{r.userEmail}</div></div> },
    { key: 'itemCount', header: 'Items' },
    { key: 'status', header: 'Status', render: (r) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[r.currentStatus] || 'bg-slate-100 text-slate-600'}`}>{r.currentStatus?.replace('_', ' ')}</span> },
    { key: 'date', header: 'Date', render: (r) => new Date(r.createdAt).toLocaleDateString() },
    { key: 'total', header: 'Total', render: (r) => formatPaise(r.totalPaise) },
  ];

  return (
    <div>
      <PageHeader title="Orders" subtitle="Manage and fulfil customer orders." />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => { setPage(1); setQ(e.target.value); }}
          placeholder="Search order #"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
        <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <span className="text-sm text-slate-400">{meta.total} orders</span>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        empty="No orders match."
        actions={(row) => (
          <button onClick={() => navigate(`/orders/${row._id}`)} className="text-sm font-medium text-indigo-600 hover:underline">Manage</button>
        )}
      />

      {meta.pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40">Prev</button>
          <span className="text-sm text-slate-600">Page {meta.page} of {meta.pages}</span>
          <button disabled={page >= meta.pages} onClick={() => setPage((p) => p + 1)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
