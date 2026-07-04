import { useEffect, useState } from 'react';
import { getAnalytics } from '../services/ops';
import { formatPaise } from '../utils/money';
import { apiErrorMessage } from '../services/api';
import PageHeader from '../components/PageHeader';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAnalytics().then(setData).catch((e) => setError(apiErrorMessage(e)));
  }, []);

  if (error) return <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>;
  if (!data) return <div className="text-slate-400">Loading analytics…</div>;

  const maxSales = Math.max(1, ...data.salesByDay.map((d) => d.salesPaise));

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Sales trend, top products, and order status mix." />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales by day */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-3 font-semibold">Sales — last 14 days</h3>
          {data.salesByDay.length === 0 ? (
            <p className="text-sm text-slate-400">No sales in this window.</p>
          ) : (
            <div className="space-y-1.5">
              {data.salesByDay.map((d) => (
                <div key={d.date} className="flex items-center gap-2 text-xs">
                  <span className="w-20 shrink-0 text-slate-500">{d.date.slice(5)}</span>
                  <div className="h-4 flex-1 rounded bg-slate-100">
                    <div className="h-4 rounded bg-indigo-500" style={{ width: `${(d.salesPaise / maxSales) * 100}%` }} />
                  </div>
                  <span className="w-24 shrink-0 text-right font-medium">{formatPaise(d.salesPaise)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top products */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-3 font-semibold">Top products</h3>
          {data.topProducts.length === 0 ? (
            <p className="text-sm text-slate-400">No data.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead><tr className="text-left text-slate-400"><th className="pb-2">Product</th><th className="pb-2 text-right">Qty</th><th className="pb-2 text-right">Revenue</th></tr></thead>
              <tbody>
                {data.topProducts.map((p) => (
                  <tr key={p.name} className="border-t border-slate-100">
                    <td className="py-2">{p.name}</td>
                    <td className="py-2 text-right">{p.qty}</td>
                    <td className="py-2 text-right font-medium">{formatPaise(p.revenuePaise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Status distribution */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-3 font-semibold">Orders by status</h3>
          <div className="flex flex-wrap gap-2">
            {data.statusDistribution.map((s) => (
              <span key={s.status} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                {s.status?.replace('_', ' ')}: <strong>{s.count}</strong>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
