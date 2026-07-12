import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCart, updateCartItem, removeCartItem, setCoupon, selectCart } from '../store/cartSlice';
import { applyCoupon } from '../services/commerce';
import { apiErrorMessage } from '../services/api';
import { formatPaise } from '../utils/money';
import { toast } from '../lib/toast';

function itemSummary(design) {
  // Name plates carry their spec under `nameplate`.
  if (design?.kind === 'nameplate') {
    const n = design.nameplate || {};
    const text = Object.values(n.fields || {}).filter(Boolean).join(' · ');
    return { options: n.templateName || 'Custom name plate', text };
  }
  // Neon signs carry their spec under `neon`, not selections/text.
  if (design?.kind === 'neon') {
    const n = design.neon || {};
    const options = [n.color?.name, n.font?.name, n.size ? `${n.size.name} · ${n.size.cm}cm` : null, n.backing?.name, n.adapter?.name]
      .filter(Boolean)
      .join(', ');
    return { options, text: n.text || '' };
  }
  const sels = design?.selections || {};
  const parts = Object.values(sels)
    .map((s) => s?.snapshot?.name)
    .filter(Boolean);
  const text = (design?.text || []).map((t) => t.value).filter(Boolean).join(' · ');
  return { options: parts.join(', '), text, color: design?.selectedColor || null };
}

export default function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cart = useSelector(selectCart);
  const [couponInput, setCouponInput] = useState(cart.couponCode || '');
  const [couponMsg, setCouponMsg] = useState(null);
  const [couponErr, setCouponErr] = useState(null);
  const [discountPaise, setDiscountPaise] = useState(0);

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
      <h1 className="mb-6 text-2xl font-bold">Your cart</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Items */}
        <div className="space-y-4">
          {cart.items.map((it) => {
            const s = itemSummary(it.designDocument);
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
                    <div>
                      <div className="font-medium text-gray-900">{it.product?.name}</div>
                      {s.text && <div className="text-sm text-gray-600">“{s.text}”</div>}
                      {s.options && <div className="mt-0.5 text-xs text-gray-400">{s.options}</div>}
                      {s.color && (
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                          <span className="inline-block h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: s.color.hex }} />
                          {s.color.name || s.color.hex}
                        </div>
                      )}
                    </div>
                    <button onClick={() => dispatch(removeCartItem(it._id))} className="text-sm text-red-600 hover:underline">
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
        <div className="h-fit rounded-xl border border-gray-200 bg-white p-6">
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

          <button
            onClick={() => navigate('/checkout')}
            className="mt-5 w-full rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Proceed to checkout
          </button>
        </div>
      </div>
    </div>
  );
}
