import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { adminOrders, downloadRender } from '../../services/ops';
import { apiErrorMessage } from '../../services/api';
import { toast } from '../../lib/toast';
import { formatPaise } from '../../utils/money';

const PIPELINE = ['pending', 'confirmed', 'design_review', 'approved', 'manufacturing', 'packed', 'shipped', 'delivered'];
const LABEL = (s) => s.replace('_', ' ');

// Everything the customer chose, per product kind (name plate / neon / simple).
function itemDetails(design) {
  if (!design) return { text: '', rows: [], swatch: null, symbols: [] };
  if (design.kind === 'nameplate') {
    const n = design.nameplate || {};
    const sel = n.selections || {};
    const fonts = [...new Set(Object.values(n.fieldStyles || {}).map((s) => s.fontName || s.fontFamily).filter(Boolean))];
    const size = n.templateWidthMm && n.templateHeightMm ? `${n.templateWidthMm} × ${n.templateHeightMm} mm` : null;
    return {
      text: Object.entries(n.fields || {}).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(' · '),
      rows: [['Template', n.templateName], ['Background', sel.backgroundName], ['Font', fonts.length ? fonts.join(', ') : sel.fontName || sel.fontFamily], ['Size', size]].filter(([, v]) => v),
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
        ['Size', n.size ? `${n.size.name} · ${n.size.heightCm ? `${n.size.heightCm} × ${n.size.cm}` : n.size.cm} cm` : null],
        ['Backing', n.backing?.name],
        ['Adapter', n.adapter?.name],
      ].filter(([, v]) => v),
      swatch: n.color?.hex ? { hex: n.color.hex, name: n.color.name } : null,
      symbols: [],
    };
  }
  return {
    text: (design.text || []).map((t) => `${t.field}: ${t.value}`).filter(Boolean).join(' · '),
    rows: Object.values(design.selections || {}).map((s) => s?.snapshot?.name).filter(Boolean).map((v, i) => [`Option ${i + 1}`, v]),
    swatch: design.selectedColor ? { hex: design.selectedColor.hex, name: design.selectedColor.name } : null,
    symbols: (design.icons || []).map((ic) => ({ name: ic?.snapshot?.name })).filter((x) => x.name),
  };
}

function Stepper({ history }) {
  const current = history[history.length - 1]?.status;
  if (current === 'cancelled') {
    return <div className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">Cancelled</div>;
  }
  const reached = new Set(history.map((h) => h.status));
  const idx = PIPELINE.indexOf(current);
  return (
    <ol className="flex flex-wrap gap-2">
      {PIPELINE.map((s, i) => {
        const done = reached.has(s) || i < idx;
        const isCurrent = s === current;
        return (
          <li key={s} className={`rounded-full px-3 py-1 text-xs font-medium ${isCurrent ? 'bg-indigo-600 text-white' : done ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
            {done && !isCurrent ? '✓ ' : ''}{LABEL(s)}
          </li>
        );
      })}
    </ol>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [target, setTarget] = useState('');
  const [override, setOverride] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const o = await adminOrders.get(id);
      setOrder(o);
      setTarget(o.nextStatuses?.[0] || '');
      setError(null);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const transition = async (status, useOverride = false) => {
    setBusy(true);
    setError(null);
    try {
      const updated = await adminOrders.updateStatus(id, { status, note, override: useOverride });
      setOrder(updated);
      setTarget(updated.nextStatuses?.[0] || '');
      setNote('');
      setOverride(false);
      toast.success(`Order marked ${status.replace(/_/g, ' ')}`);
    } catch (e) {
      const msg = apiErrorMessage(e);
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const onDownload = async (item, format = 'png') => {
    setDownloading(`${item._id}:${format}`);
    try {
      await downloadRender(id, item._id, `${order.orderNumber}-${item._id}.${format}`, format);
    } catch (e) {
      setError(apiErrorMessage(e, 'Render failed'));
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return <div className="text-slate-400">Loading…</div>;
  if (!order) return <div className="text-slate-500">Order not found. <Link to="/orders" className="text-indigo-600 hover:underline">Back</Link></div>;

  const current = order.statusHistory[order.statusHistory.length - 1]?.status;
  const canCancelFrom = ['manufacturing', 'packed'].includes(current);
  const nexts = order.nextStatuses || [];

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
          <p className="text-sm text-slate-500">{order.user?.name} · {order.user?.email} · {new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <Link to="/orders" className="text-sm text-indigo-600 hover:underline">All orders</Link>
      </div>

      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {/* Status + management */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Status</h3>
        <Stepper history={order.statusHistory} />

        {/* Design review shortcut */}
        {current === 'design_review' && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-800">Design review</p>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Review note (optional)" rows={2} className="mt-2 w-full rounded-md border border-amber-200 px-3 py-2 text-sm" />
            <div className="mt-2 flex gap-2">
              <button disabled={busy} onClick={() => transition('approved')} className="rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60">Approve design</button>
              <button disabled={busy} onClick={() => transition('confirmed')} className="rounded-md border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-60">Request rework</button>
            </div>
          </div>
        )}

        {/* General transition */}
        {nexts.length > 0 && (
          <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
            <div>
              <label className="block text-xs font-medium text-slate-500">Advance to</label>
              <select value={target} onChange={(e) => setTarget(e.target.value)} className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm">
                {nexts.map((s) => <option key={s} value={s}>{LABEL(s)}</option>)}
              </select>
            </div>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" className="min-w-48 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
            {canCancelFrom && target === 'cancelled' && (
              <label className="flex items-center gap-1 text-sm text-red-600">
                <input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} /> override
              </label>
            )}
            <button disabled={busy || !target} onClick={() => transition(target, override)} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
              Update status
            </button>
          </div>
        )}
        {nexts.length === 0 && <p className="mt-4 text-sm text-slate-400">This order is in a terminal state.</p>}
      </div>

      {/* Items */}
      <div className="space-y-3">
        {order.items.map((it) => {
          const d = itemDetails(it.designDocument);
          const img = it.previewImageUrl || it.product?.images?.[0] || null;
          return (
            <div key={it._id} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                {img ? <img src={img} alt={it.productNameSnapshot || ''} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-slate-400">No image</div>}
              </div>
              <div className="flex-1 text-sm">
                <div className="font-medium text-slate-900">{it.productNameSnapshot}</div>
                {d.text && <div className="text-slate-700">{d.text}</div>}
                <dl className="mt-1 space-y-0.5 text-xs text-slate-500">
                  {d.rows.map(([label, value]) => (
                    <div key={label} className="flex gap-1.5"><dt className="font-medium text-slate-400">{label}:</dt><dd className="text-slate-600">{value}</dd></div>
                  ))}
                  {d.swatch && (
                    <div className="flex items-center gap-1.5">
                      <dt className="font-medium text-slate-400">Colour:</dt>
                      <dd className="flex items-center gap-1.5 text-slate-600">
                        <span className="inline-block h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: d.swatch.hex }} />
                        {d.swatch.name || d.swatch.hex}
                      </dd>
                    </div>
                  )}
                </dl>
                {d.symbols.length > 0 && (
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-slate-400">Symbol:</span>
                    {d.symbols.map((sy, i) => (
                      <span key={i} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                        {sy.image && <img src={sy.image} alt="" className="h-4 w-4 object-contain" />}
                        {sy.name}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-1 text-xs text-slate-500">Qty {it.quantity} · {formatPaise(it.lineTotalPaise)}</div>
              </div>
              <div className="h-fit shrink-0">
                <div className="mb-1 text-right text-[11px] font-medium uppercase tracking-wide text-slate-400">Production render</div>
                <div className="flex gap-1.5">
                  {['png', 'svg', 'pdf'].map((fmt) => (
                    <button
                      key={fmt}
                      disabled={downloading === `${it._id}:${fmt}`}
                      onClick={() => onDownload(it, fmt)}
                      title={`Download ${fmt.toUpperCase()}`}
                      className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold uppercase text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-60"
                    >
                      {downloading === `${it._id}:${fmt}` ? '…' : `⬇ ${fmt}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Totals + payment */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm">
          <h3 className="mb-3 font-semibold text-slate-700">Payment</h3>
          <dl className="space-y-1.5">
            <div className="flex justify-between"><dt className="text-slate-600">Subtotal</dt><dd>{formatPaise(order.subtotalPaise)}</dd></div>
            {order.discountPaise > 0 && <div className="flex justify-between text-green-600"><dt>Discount{order.couponSnapshot?.code ? ` (${order.couponSnapshot.code})` : ''}</dt><dd>−{formatPaise(order.discountPaise)}</dd></div>}
            <div className="flex justify-between"><dt className="text-slate-600">Tax</dt><dd>{formatPaise(order.taxPaise)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-600">Shipping</dt><dd>{order.shippingPaise === 0 ? 'Free' : formatPaise(order.shippingPaise)}</dd></div>
            <div className="flex justify-between border-t border-slate-100 pt-1.5 font-semibold"><dt>Total</dt><dd>{formatPaise(order.totalPaise)}</dd></div>
          </dl>
          <p className="mt-3 text-xs text-slate-400">
            Razorpay {order.payment?.mock ? '(mock)' : ''} · {order.payment?.verified ? 'verified ✓' : 'unverified'}<br />
            {order.payment?.razorpayPaymentId}
          </p>
        </div>

        {/* Address + history */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm">
          <h3 className="mb-3 font-semibold text-slate-700">Shipping</h3>
          <address className="not-italic text-slate-600">
            <div className="font-medium text-slate-900">{order.address?.name}</div>
            <div>{order.address?.line1}{order.address?.line2 ? `, ${order.address.line2}` : ''}</div>
            <div>{order.address?.city}, {order.address?.state} {order.address?.pincode}</div>
            <div>{order.address?.phone}</div>
          </address>
          {order.giftWrap && <p className="mt-2 text-xs text-indigo-600">🎁 Gift wrapped</p>}
        </div>
      </div>

      {/* History timeline */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">History</h3>
        <ol className="space-y-2">
          {order.statusHistory.map((h, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{LABEL(h.status)}</span>
              <div className="text-slate-500">
                {new Date(h.at).toLocaleString()}
                {h.note && <span className="text-slate-700"> — {h.note}</span>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
