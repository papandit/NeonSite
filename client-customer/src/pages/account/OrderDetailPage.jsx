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

// Everything the customer chose, per product kind (name plate / neon / simple).
function itemDetails(design, fallback = {}) {
  if (!design) return { text: '', rows: [], swatch: null, symbols: [] };
  if (design.kind === 'nameplate') {
    const n = design.nameplate || {};
    const sel = n.selections || {};
    const fonts = [...new Set(Object.values(n.fieldStyles || {}).map((s) => s.fontName || s.fontFamily).filter(Boolean))];
    const size = sel.sizeName
      ? [sel.sizeName, sel.sizeLabel].filter(Boolean).join(' · ')
      : (n.templateWidthMm && n.templateHeightMm ? `${n.templateWidthMm} × ${n.templateHeightMm} mm` : null);
    return {
      text: Object.values(n.fields || {}).filter(Boolean).join(' · '),
      rows: [['Template', n.templateName], ['Background', sel.customBackgroundUrl ? 'Customer-supplied image' : sel.backgroundName], ['Font', fonts.length ? fonts.join(', ') : sel.fontName || sel.fontFamily], ['Size', size]].filter(([, v]) => v),
      swatch: sel.colorHex ? { hex: sel.colorHex, name: sel.colorName } : null,
      symbols: (n.elements || []).filter((e) => e?.name || e?.image),
    };
  }
  if (design.kind === 'neon') {
    const n = design.neon || {};
    return {
      text: n.text || '',
      rows: [
        ['Font', n.font?.name],
        ['Size', n.size ? `${n.size.name} · ${n.size.heightCm ? `${n.size.heightCm} × ${n.size.cm}` : n.size.cm} ${n.size.unit || 'cm'}` : null],
        ['Backing', n.backing?.name],
        ['Adapter', n.adapter?.name],
      ].filter(([, v]) => v),
      swatch: n.color?.hex ? { hex: n.color.hex, name: n.color.name } : null,
      symbols: [],
    };
  }
  // Simple / neon-sign product: show the frozen product attributes.
  const ps = design.productSnapshot || {};
  const size = [ps.sizeText || fallback.sizeText, ps.sizeUnits || fallback.sizeUnits].filter(Boolean).join(' ') || ps.dimensions || fallback.dimensions;
  return {
    text: (design.text || []).map((t) => t.value).filter(Boolean).join(' · '),
    rows: [
      ['Size', size],
      ['Colour', ps.colorText || fallback.colorText],
      ['Material', ps.material || fallback.material],
      ...Object.values(design.selections || {}).map((s) => s?.snapshot?.name).filter(Boolean).map((v, i) => [`Option ${i + 1}`, v]),
    ].filter(([, v]) => v),
    description: ps.description || fallback.description || '',
    swatch: design.selectedColor ? { hex: design.selectedColor.hex, name: design.selectedColor.name } : null,
    symbols: [],
  };
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
          const d = itemDetails(it.designDocument, it.product || {});
          const img = it.previewImageUrl || it.product?.images?.[0] || null;
          return (
            <div key={it._id} className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-slate-50">
                {img ? <img src={img} alt={it.productNameSnapshot || ''} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-gray-400">No image</div>}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{it.productNameSnapshot}</div>
                {d.text && <div className="text-sm text-gray-700">“{d.text}”</div>}

                <dl className="mt-1.5 space-y-0.5 text-xs text-gray-500">
                  {d.rows.map(([label, value]) => (
                    <div key={label} className="flex gap-1.5">
                      <dt className="font-medium text-gray-400">{label}:</dt>
                      <dd className="text-gray-600">{value}</dd>
                    </div>
                  ))}
                  {d.swatch && (
                    <div className="flex items-center gap-1.5">
                      <dt className="font-medium text-gray-400">Colour:</dt>
                      <dd className="flex items-center gap-1.5 text-gray-600">
                        <span className="inline-block h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: d.swatch.hex }} />
                        {d.swatch.name || d.swatch.hex}
                      </dd>
                    </div>
                  )}
                </dl>
                {d.description && <p className="mt-1.5 text-xs leading-relaxed text-gray-500">{d.description}</p>}

                {d.symbols.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-gray-400">Symbol:</span>
                    {d.symbols.map((sy, i) => (
                      <span key={i} className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-600">
                        {sy.image && <img src={sy.image} alt="" className="h-4 w-4 object-contain" />}
                        {sy.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-1.5 text-xs text-gray-500">Qty {it.quantity}</div>
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
