import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectCart, fetchCart } from '../store/cartSlice';
import { checkoutQuote, createPaymentOrder, verifyPayment, placeCodOrder } from '../services/commerce';
import { payAndVerify } from '../services/razorpay';
import { useAddresses } from '../hooks/useAddresses';
import { apiErrorMessage } from '../services/api';
import { formatPaise } from '../utils/money';
import { toast } from '../lib/toast';
import Breadcrumbs from '../components/Breadcrumbs';

const PAY_KEY = 'nc_payment_method'; // remember the last-used method

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cart = useSelector(selectCart);
  const { addresses, add: saveAddress } = useAddresses();

  const [totals, setTotals] = useState(null);
  const [giftWrap, setGiftWrap] = useState(false);
  const [method, setMethod] = useState(() => localStorage.getItem(PAY_KEY) || 'online');
  const [confirm, setConfirm] = useState(null); // pending address awaiting confirmation
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(null);

  const chooseMethod = (m) => { setMethod(m); localStorage.setItem(PAY_KEY, m); };

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '' },
  });

  // Ensure cart is loaded, then fetch the server quote.
  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  useEffect(() => {
    setLoadingQuote(true);
    checkoutQuote(cart.couponCode)
      .then(setTotals)
      .catch((e) => setError(apiErrorMessage(e)))
      .finally(() => setLoadingQuote(false));
  }, [cart.couponCode, cart.count]);

  // Prefill from the most recent saved address.
  useEffect(() => {
    if (addresses.length) {
      const a = addresses[addresses.length - 1];
      reset({ name: a.name, phone: a.phone, line1: a.line1, line2: a.line2 || '', city: a.city, state: a.state, pincode: a.pincode });
    }
  }, [addresses, reset]);

  // Address validated → ask for confirmation before charging / placing.
  const onSubmit = (address) => {
    setError(null);
    saveAddress(address);
    setConfirm(address);
  };

  const confirmOrder = async () => {
    const address = confirm;
    setConfirm(null);
    setPaying(true);
    setError(null);
    try {
      let result;
      if (method === 'cod') {
        result = await placeCodOrder({ address, giftWrap, couponCode: cart.couponCode });
      } else {
        const orderResp = await createPaymentOrder(cart.couponCode);
        result = await payAndVerify({ orderResp, address, giftWrap, couponCode: cart.couponCode, onVerify: verifyPayment });
      }
      await dispatch(fetchCart()); // server cleared the cart
      toast.success(method === 'cod' ? 'Order placed! Pay on delivery.' : 'Payment successful — order placed!');
      navigate(`/account/orders/${result.order._id}?new=1`);
    } catch (e) {
      const msg = apiErrorMessage(e, method === 'cod' ? 'Could not place your order' : 'Payment could not be completed');
      setError(msg);
      toast.error(msg);
    } finally {
      setPaying(false);
    }
  };

  if (cart.items.length === 0 && !paying) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center text-gray-500">
        Your cart is empty. <button onClick={() => navigate('/products')} className="text-indigo-600 hover:underline">Browse products</button>
      </div>
    );
  }

  const field = (name, label, opts = {}, type = 'text') => (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input type={type} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" {...register(name, opts)} />
      {errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name].message}</p>}
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ label: 'Cart', to: '/cart' }, { label: 'Checkout' }]} />
      <h1 className="mb-6 text-2xl font-bold">Checkout</h1>

      {error && <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Address */}
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold">Shipping address</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {field('name', 'Full name', { required: 'Required' })}
            {field('phone', 'Phone', { required: 'Required', minLength: { value: 10, message: '10 digits' } })}
          </div>
          {field('line1', 'Address line 1', { required: 'Required' })}
          {field('line2', 'Address line 2')}
          <div className="grid gap-4 sm:grid-cols-3">
            {field('city', 'City', { required: 'Required' })}
            {field('state', 'State', { required: 'Required' })}
            {field('pincode', 'Pincode', { required: 'Required' })}
          </div>
          <label className="flex items-center gap-2 pt-2 text-sm text-gray-700">
            <input type="checkbox" checked={giftWrap} onChange={(e) => setGiftWrap(e.target.checked)} />
            Add gift wrapping
          </label>

          {/* Payment method */}
          <div className="border-t border-gray-100 pt-4">
            <h2 className="font-semibold">Payment method</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {[
                ['online', 'Pay online', 'Card / UPI / Netbanking via Razorpay'],
                ['cod', 'Cash on Delivery', 'Pay in cash when it arrives'],
              ].map(([m, title, desc]) => (
                <button
                  key={m} type="button" onClick={() => chooseMethod(m)}
                  className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${method === m ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${method === m ? 'border-indigo-600' : 'border-gray-300'}`}>
                    {method === m && <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-gray-900">{title}</span>
                    <span className="block text-xs text-gray-500">{desc}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="h-fit rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold">Order summary</h2>
          {loadingQuote || !totals ? (
            <p className="mt-4 text-sm text-gray-400">Calculating…</p>
          ) : (
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-gray-600">Subtotal</dt><dd>{formatPaise(totals.subtotalPaise)}</dd></div>
              {totals.discountPaise > 0 && (
                <div className="flex justify-between text-green-600"><dt>Discount{totals.coupon?.snapshot?.code ? ` (${totals.coupon.snapshot.code})` : ''}</dt><dd>−{formatPaise(totals.discountPaise)}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-gray-600">GST ({totals.gstRatePercent}%)</dt><dd>{formatPaise(totals.taxPaise)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-600">Shipping</dt><dd>{totals.shippingPaise === 0 ? 'Free' : formatPaise(totals.shippingPaise)}</dd></div>
              <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-semibold"><dt>Total</dt><dd>{formatPaise(totals.totalPaise)}</dd></div>
            </dl>
          )}
          <button type="submit" disabled={paying || loadingQuote} className="mt-5 w-full rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
            {paying ? 'Processing…' : method === 'cod' ? 'Place order' : totals ? `Pay ${formatPaise(totals.totalPaise)}` : 'Pay'}
          </button>
          <p className="mt-2 text-center text-xs text-gray-400">{method === 'cod' ? 'Pay in cash on delivery' : 'Secured by Razorpay'}</p>
        </div>
      </form>

      {/* Confirmation */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirm(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900">Confirm your order</h3>
            <dl className="mt-4 space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Payment</dt><dd className="font-medium">{method === 'cod' ? 'Cash on Delivery' : 'Pay online (Razorpay)'}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Deliver to</dt><dd className="max-w-[60%] truncate text-right font-medium">{confirm.name}, {confirm.city}</dd></div>
              <div className="flex justify-between border-t border-gray-100 pt-2 text-base"><dt className="font-semibold">Total</dt><dd className="font-semibold">{totals ? formatPaise(totals.totalPaise) : '—'}</dd></div>
            </dl>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setConfirm(null)} className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={confirmOrder} className="flex-1 rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
                {method === 'cod' ? 'Place order' : `Pay ${totals ? formatPaise(totals.totalPaise) : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
