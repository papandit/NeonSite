import { useCallback, useEffect, useState } from 'react';
import { reviewsApi } from '../services/ops';
import { apiErrorMessage } from '../services/api';
import PageHeader from '../components/PageHeader';

const STAR = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);
const STATUS_STYLE = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
};

export default function ReviewsPage() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await reviewsApi.list(status || undefined)); setError(null); }
    catch (e) { setError(apiErrorMessage(e)); }
    finally { setLoading(false); }
  }, [status]);
  useEffect(() => { load(); }, [load]);

  const moderate = async (id, newStatus) => {
    try { await reviewsApi.moderate(id, newStatus); await load(); }
    catch (e) { setError(apiErrorMessage(e)); }
  };

  return (
    <div>
      <PageHeader title="Reviews" subtitle="Approve reviews to publish them and update product ratings." />

      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm text-slate-600">Filter:</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm">
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {loading ? (
        <p className="text-slate-400">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-slate-400">No reviews.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r._id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400">{STAR(r.rating)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                  </div>
                  {r.title && <div className="mt-1 font-medium text-slate-900">{r.title}</div>}
                  {r.comment && <p className="mt-1 text-sm text-slate-600">{r.comment}</p>}
                  <div className="mt-2 text-xs text-slate-400">
                    {r.user?.name} · {r.product?.name} · {new Date(r.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  {r.status !== 'approved' && <button onClick={() => moderate(r._id, 'approved')} className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700">Approve</button>}
                  {r.status !== 'rejected' && <button onClick={() => moderate(r._id, 'rejected')} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Reject</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
