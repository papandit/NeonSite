import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../services/ops';
import { formatPaise } from '../utils/money';
import { apiErrorMessage } from '../services/api';

const STATUS_STYLE = {
  confirmed: 'bg-blue-50 text-blue-700',
  design_review: 'bg-amber-50 text-amber-700',
  approved: 'bg-indigo-50 text-indigo-700',
  manufacturing: 'bg-purple-50 text-purple-700',
  packed: 'bg-cyan-50 text-cyan-700',
  shipped: 'bg-teal-50 text-teal-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
  pending: 'bg-slate-100 text-slate-600',
};

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="text-xs font-medium uppercase text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getDashboard().then(setData).catch((e) => setError(apiErrorMessage(e)));
  }, []);

  if (error) return <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>;
  if (!data) return <div className="text-slate-400">Loading metrics…</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-600">Live store metrics.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total sales" value={formatPaise(data.totalSalesPaise)} />
        <StatCard label="Total orders" value={data.totalOrders} />
        <StatCard label="Today's orders" value={data.todaysOrders} />
        <StatCard label="Today's revenue" value={formatPaise(data.todaysRevenuePaise)} />
        <StatCard label="Pending orders" value={data.pendingOrders} sub="not delivered/cancelled" />
        <StatCard label="Customers" value={data.customerCount} />
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Recent orders</h2>
          <Link to="/orders" className="text-sm font-medium text-indigo-600 hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Order</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Items</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Date</th>
                <th className="px-4 py-3 text-right font-medium text-slate-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recentOrders.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">No orders yet.</td></tr>
              ) : (
                data.recentOrders.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link to={`/orders/${o._id}`} className="font-medium text-indigo-600 hover:underline">{o.orderNumber}</Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{o.itemCount}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[o.status] || 'bg-slate-100 text-slate-600'}`}>
                        {o.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatPaise(o.totalPaise)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
