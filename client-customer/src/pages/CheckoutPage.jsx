import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectCart, fetchCart } from '../store/cartSlice';
import { checkoutQuote, createPaymentOrder, verifyPayment } from '../services/commerce';
import { payAndVerify } from '../services/razorpay';
import { useAddresses } from '../hooks/useAddresses';
import { apiErrorMessage } from '../services/api';
import { formatPaise } from '../utils/money';

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cart = useSelector(selectCart);
  const { addresses, add: saveAddress } = useAddresses();

  const [totals, setTotals] = useState(null);
  const [giftWrap, setGiftWrap] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(null);

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

  const onSubmit = async (address) => {
    setPaying(true);
    setError(null);
    try {
      saveAddress(address);
      const orderResp = await createPaymentOrder(cart.couponCode);
      const result = await payAndVerify({
        orderResp,
        address,
        giftWrap,
        couponCode: cart.couponCode,
        onVerify: verifyPayment,
      });
      await dispatch(fetchCart()); // server cleared the cart
      navigate(`/account/orders/${result.order._id}?new=1`);
    } catch (e) {
      setError(apiErrorMessage(e, 'Payment could not be completed'));
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
          <button type="submit" disabled={paying || loadingQuote} className="mt-5 w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
            {paying ? 'Processing…' : totals ? `Pay ${formatPaise(totals.totalPaise)}` : 'Pay'}
          </button>
          <p className="mt-2 text-center text-xs text-gray-400">Secured by Razorpay</p>
        </div>
      </form>
    </div>
  );
}
