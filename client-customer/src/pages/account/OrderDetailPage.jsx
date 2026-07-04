import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ordersApi } from '../../services/commerce';
import { api } from '../../services/api';
import { formatPaise } from '../../utils/money';

const PIPELINE = ['confirmed', 'design_review', 'approved', 'manufacturing', 'packed', 'shipped', 'delivered'];
const LABEL = {
  confirmed: 'Confirmed', design_review: 'Design review', approved: 'Approved',
  manufacturing: 'Manufacturing', packed: 'Packed', shipped: 'Shipped', delivered: 'Delivered',
};

function StatusStepper({ statusHistory }) {
  const current = statusHistory[statusHistory.length - 1]?.status;
  if (current === 'cancelled') {
    return <div className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">This order was cancelled.</div>;
  }
  const reached = new Set(statusHistory.map((h) => h.status));
  const currentIdx = PIPELINE.indexOf(current);
  return (
    <ol className="flex flex-wrap gap-2">
      {PIPELINE.map((s, i) => {
        const done = reached.has(s) || i < currentIdx;
        const isCurrent = s === current;
        return (
          <li key={s} className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
            isCurrent ? 'bg-indigo-600 text-white' : done ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'
          }`}>
            <span>{done && !isCurrent ? '✓' : i + 1}</span>
            {LABEL[s]}
          </li>
        );
      })}
    </ol>
  );
}

function itemSummary(design) {
  const options = Object.values(design?.selections || {}).map((s) => s?.snapshot?.name).filter(Boolean).join(', ');
  const text = (design?.text || []).map((t) => t.value).filter(Boolean).join(' · ');
  return { options, text };
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const isNew = params.get('new') === '1';
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    ordersApi.get(id).then(setOrder).catch(() => setOrder(null)).finally(() => setLoading(false));
  }, [id]);

  const downloadInvoice = async () => {
    setDownloading(true);
    try {
      const res = await api.get(`/orders/${id}/invoice`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${order.orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <p className="text-gray-400">Loading…</p>;
  if (!order) return <p className="text-gray-500">Order not found. <Link to="/account/orders" className="text-indigo-600 hover:underline">Back to orders</Link></p>;

  return (
    <div className="space-y-6">
      {isNew && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="font-semibold text-green-800">🎉 Order placed successfully!</p>
          <p className="mt-1 text-sm text-green-700">Your payment was verified and your order is confirmed.</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{order.orderNumber}</h2>
          <p className="text-sm text-gray-400">Placed {new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <Link to="/account/orders" className="text-sm text-indigo-600 hover:underline">All orders</Link>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Status</h3>
        <StatusStepper statusHistory={order.statusHistory} />
      </div>

      {/* Items */}
      <div className="space-y-3">
        {order.items.map((it) => {
          const s = itemSummary(it.designDocument);
          return (
            <div key={it._id} className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-50">
                {it.previewImageUrl ? <img src={it.previewImageUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-gray-400">No preview</div>}
              </div>
              <div className="flex-1">
                <div className="font-medium">{it.productNameSnapshot}</div>
                {s.text && <div className="text-sm text-gray-600">“{s.text}”</div>}
                {s.options && <div className="text-xs text-gray-400">{s.options}</div>}
                <div className="mt-1 text-xs text-gray-500">Qty {it.quantity}</div>
              </div>
              <div className="text-right font-semibold">{formatPaise(it.lineTotalPaise)}</div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Totals */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Payment</h3>
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between"><dt className="text-gray-600">Subtotal</dt><dd>{formatPaise(order.subtotalPaise)}</dd></div>
            {order.discountPaise > 0 && <div className="flex justify-between text-green-600"><dt>Discount</dt><dd>−{formatPaise(order.discountPaise)}</dd></div>}
            <div className="flex justify-between"><dt className="text-gray-600">Tax</dt><dd>{formatPaise(order.taxPaise)}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-600">Shipping</dt><dd>{order.shippingPaise === 0 ? 'Free' : formatPaise(order.shippingPaise)}</dd></div>
            <div className="flex justify-between border-t border-gray-100 pt-1.5 font-semibold"><dt>Total</dt><dd>{formatPaise(order.totalPaise)}</dd></div>
          </dl>
          <button onClick={downloadInvoice} disabled={downloading} className="mt-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">
            {downloading ? 'Preparing…' : '⬇ Download invoice (PDF)'}
          </button>
        </div>

        {/* Address */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Shipping to</h3>
          <address className="text-sm not-italic text-gray-600">
            <div className="font-medium text-gray-900">{order.address?.name}</div>
            <div>{order.address?.line1}</div>
            {order.address?.line2 && <div>{order.address.line2}</div>}
            <div>{order.address?.city}, {order.address?.state} {order.address?.pincode}</div>
            <div>{order.address?.phone}</div>
          </address>
          {order.giftWrap && <p className="mt-2 text-xs text-indigo-600">🎁 Gift wrapped</p>}
        </div>
      </div>
    </div>
  );
}
