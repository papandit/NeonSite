import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCart, updateCartItem, removeCartItem, setCoupon, selectCart } from '../store/cartSlice';
import { applyCoupon } from '../services/commerce';
import { apiErrorMessage } from '../services/api';
import { formatPaise } from '../utils/money';
import { toast } from '../lib/toast';
import { useSiteSettings } from '../context/SiteSettings';

// Everything the customer chose, per kind — text, detail rows, colour swatches, symbols.
function itemDetails(design, fallback = {}) {
  if (!design) return { text: '', rows: [], swatches: [], symbols: [] };
  if (design.kind === 'nameplate') {
    const n = design.nameplate || {};
    const sel = n.selections || {};
    const styleVals = Object.values(n.fieldStyles || {});
    const fonts = [...new Set(styleVals.map((s) => s.fontName || s.fontFamily).filter(Boolean))];
    const swatches = [];
    const seen = new Set();
    for (const s of styleVals) {
      const hex = s.colorHex;
      if (!hex || seen.has(hex.toLowerCase())) continue;
      seen.add(hex.toLowerCase());
      swatches.push({ hex, name: s.colorName });
    }
    if (!swatches.length && sel.colorHex) swatches.push({ hex: sel.colorHex, name: sel.colorName });
    const size = sel.sizeName
      ? [sel.sizeName, sel.sizeLabel].filter(Boolean).join(' · ')
      : (n.templateWidthMm && n.templateHeightMm ? `${n.templateWidthMm} × ${n.templateHeightMm} mm` : null);
    return {
      text: Object.values(n.fields || {}).filter(Boolean).join(' · '),
      rows: [['Template', n.templateName], ['Background', sel.customBackgroundUrl ? 'Customer-supplied image' : sel.backgroundName], ['Font', fonts.length ? fonts.join(', ') : sel.fontName || sel.fontFamily], ['Size', size]].filter(([, v]) => v),
      swatches,
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
      swatches: n.color?.hex ? [{ hex: n.color.hex, name: n.color.name }] : [],
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
    swatches: design.selectedColor ? [{ hex: design.selectedColor.hex, name: design.selectedColor.name }] : [],
    symbols: [],
  };
}

export default function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cart = useSelector(selectCart);
  const [couponInput, setCouponInput] = useState(cart.couponCode || '');
  const [couponMsg, setCouponMsg] = useState(null);
  const [couponErr, setCouponErr] = useState(null);
  const [discountPaise, setDiscountPaise] = useState(0);
  const { settings } = useSiteSettings();

  const itemCount = cart.items.reduce((n, it) => n + (it.quantity || 1), 0);
  // How much more to qualify for free delivery. Shown as encouragement, not a
  // promise — the shipping line is still computed at checkout.
  const freeAt = settings.freeShippingAbovePaise || 0;
  const afterDiscount = Math.max(0, cart.subtotalPaise - discountPaise);
  const toFreeShipping = freeAt > 0 ? freeAt - afterDiscount : 0;

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const onApplyCoupon = async () => {
    setCouponErr(null);
    setCouponMsg(null);
    try {
      const res = await applyCoupon(couponInput.trim());
      setDiscountPaise(res.discountPaise);
      dispatch(setCoupon(res.code));
      setCouponMsg(`Coupon ${res.code} applied — you save ${formatPaise(res.discountPaise)}`);
      toast.success(`Coupon ${res.code} applied`);
    } catch (e) {
      const msg = apiErrorMessage(e, 'Invalid coupon');
      setDiscountPaise(0);
      setCouponErr(msg);
      toast.error(msg);
    }
  };

  const changeQty = (itemId, quantity) => {
    if (quantity < 1) return;
    dispatch(updateCartItem({ itemId, patch: { quantity } }));
  };

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-gray-500">Design a name plate to get started.</p>
        <Link to="/products" className="mt-6 inline-block rounded-full bg-indigo-600 px-5 py-3 text-sm font-medium text-white hover:bg-indigo-700">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold">
          Your cart
          <span className="ml-2 text-base font-normal text-gray-500">
            {itemCount} item{itemCount === 1 ? '' : 's'}
          </span>
        </h1>
        <Link to="/products" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
          <svg viewBox="0 0 24 24" className="h-4 w-4 transition group-hover:-translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          Continue shopping
        </Link>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_340px]">
        {/* Items */}
        <div className="space-y-4">
          {cart.items.map((it) => {
            const d = itemDetails(it.designDocument, it.product || {});
            // Custom-design preview (name plate / neon) first, else the product's own image.
            const img = it.previewImageUrl || it.product?.images?.[0] || null;
            return (
              <div key={it._id} className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-slate-50">
                  {img ? (
                    <img src={img} alt={it.product?.name || ''} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-gray-400">No image</div>
                  )}
                </div>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900">{it.product?.name}</div>
                      {d.text && <div className="text-sm text-gray-600">“{d.text}”</div>}
                      <dl className="mt-1 space-y-0.5 text-xs text-gray-500">
                        {d.rows.map(([label, value]) => (
                          <div key={label} className="flex gap-1.5"><dt className="font-medium text-gray-400">{label}:</dt><dd className="text-gray-600">{value}</dd></div>
                        ))}
                        {d.swatches.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <dt className="font-medium text-gray-400">Colour:</dt>
                            <dd className="flex flex-wrap items-center gap-x-2 gap-y-1 text-gray-600">
                              {d.swatches.map((sw, i) => (
                                <span key={i} className="inline-flex items-center gap-1">
                                  <span className="inline-block h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: sw.hex }} />
                                  {sw.name || sw.hex}
                                </span>
                              ))}
                            </dd>
                          </div>
                        )}
                      </dl>
                      {d.description && <p className="mt-1 line-clamp-2 text-xs text-gray-400">{d.description}</p>}
                      {d.symbols.length > 0 && (
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-medium text-gray-400">Symbol:</span>
                          {d.symbols.map((sy, i) => (
                            <span key={i} className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-600">
                              {sy.image && <img src={sy.image} alt="" className="h-4 w-4 object-contain" />}
                              {sy.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={() => dispatch(removeCartItem(it._id))} className="shrink-0 text-sm text-red-600 hover:underline">
                      Remove
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="inline-flex items-center rounded-md border border-gray-300">
                      <button onClick={() => changeQty(it._id, it.quantity - 1)} className="px-3 py-1 text-gray-600 hover:bg-gray-50">−</button>
                      <span className="min-w-8 px-2 text-center text-sm">{it.quantity}</span>
                      <button onClick={() => changeQty(it._id, it.quantity + 1)} className="px-3 py-1 text-gray-600 hover:bg-gray-50">+</button>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatPaise(it.lineTotalPaise)}</div>
                      <div className="text-xs text-gray-400">{formatPaise(it.unitPricePaise)} each</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        {/* Sticky so the total and the checkout button stay reachable while
            you scroll a long cart. */}
        <div className="h-fit rounded-xl border border-gray-200 bg-white p-6 lg:sticky lg:top-24">
          <h2 className="font-semibold">Order summary</h2>

          <div className="mt-4">
            <label className="text-sm font-medium text-gray-700">Coupon</label>
            <div className="mt-1 flex gap-2">
              <input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="Code"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm uppercase"
              />
              <button onClick={onApplyCoupon} className="rounded-full bg-gray-800 px-3 py-2 text-sm font-medium text-white hover:bg-gray-900">Apply</button>
            </div>
            {couponMsg && <p className="mt-1 text-xs text-green-600">{couponMsg}</p>}
            {couponErr && <p className="mt-1 text-xs text-red-600">{couponErr}</p>}
          </div>

          <dl className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">Subtotal</dt>
              <dd className="font-medium">{formatPaise(cart.subtotalPaise)}</dd>
            </div>
            {discountPaise > 0 && (
              <div className="flex justify-between text-green-600">
                <dt>Discount</dt>
                <dd>−{formatPaise(discountPaise)}</dd>
              </div>
            )}
            <div className="flex justify-between text-gray-400">
              <dt>Taxes &amp; shipping</dt>
              <dd>calculated at checkout</dd>
            </div>
          </dl>

          {freeAt > 0 && (
            <div className="mt-4 rounded-lg bg-indigo-50/70 px-3 py-2.5">
              {toFreeShipping > 0 ? (
                <>
                  <p className="text-xs text-indigo-900">
                    Add <span className="font-semibold">{formatPaise(toFreeShipping)}</span> more for free delivery
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-indigo-100">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-[width] duration-500"
                      style={{ width: `${Math.min(100, (afterDiscount / freeAt) * 100)}%` }}
                    />
                  </div>
                </>
              ) : (
                <p className="flex items-center gap-1.5 text-xs font-medium text-indigo-900">
                  <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Your order qualifies for free delivery
                </p>
              )}
            </div>
          )}

          <button
            onClick={() => navigate('/checkout')}
            className="mt-5 w-full rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Proceed to checkout
          </button>

          <Link
            to="/products"
            className="mt-2.5 block w-full rounded-full border border-gray-300 px-4 py-2.5 text-center text-sm font-medium text-gray-700 transition hover:border-indigo-400 hover:text-indigo-700"
          >
            Continue shopping
          </Link>

          <ul className="mt-5 space-y-2 border-t border-gray-100 pt-4 text-xs text-gray-500">
            {[
              'Secure Razorpay checkout',
              'Made to order — 2 year warranty',
              'Tracked delivery across India',
            ].map((line) => (
              <li key={line} className="flex items-center gap-2">
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 shrink-0 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
