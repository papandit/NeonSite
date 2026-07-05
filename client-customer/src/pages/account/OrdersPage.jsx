import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ordersApi } from '../../services/commerce';
import { formatPaise } from '../../utils/money';

const STATUS_STYLE = {
  confirmed: 'bg-blue-50 text-blue-700',
  design_review: 'bg-amber-50 text-amber-700',
  approved: 'bg-indigo-50 text-indigo-700',
  manufacturing: 'bg-purple-50 text-purple-700',
  packed: 'bg-cyan-50 text-cyan-700',
  shipped: 'bg-teal-50 text-teal-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
  pending: 'bg-gray-100 text-gray-600',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.list().then(setOrders).catch(() => setOrders([])).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400">Loading orders…</p>;

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
        <p className="text-gray-500">You haven’t placed any orders yet.</p>
        <Link to="/products" className="mt-4 inline-block rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Start designing</Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <Link key={o._id} to={`/account/orders/${o._id}`} className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 hover:shadow-sm">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-50">
            {o.previewImageUrl ? <img src={o.previewImageUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[10px] text-gray-400">—</div>}
          </div>
          <div className="flex-1">
            <div className="font-medium text-gray-900">{o.orderNumber}</div>
            <div className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString()} · {o.itemCount} item{o.itemCount === 1 ? '' : 's'}</div>
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[o.status] || 'bg-gray-100 text-gray-600'}`}>
            {o.status?.replace('_', ' ')}
          </span>
          <div className="w-24 text-right font-semibold">{formatPaise(o.totalPaise)}</div>
        </Link>
      ))}
    </div>
  );
}
