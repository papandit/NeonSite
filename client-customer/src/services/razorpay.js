// Razorpay checkout on the client. In MOCK mode (no keys server-side) it skips
// the widget and verifies directly, so the flow works in local dev.

function loadScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

/**
 * @param {object} args
 * @param {{ order:{id,amount,currency,keyId,mock}, mode:string }} args.orderResp
 * @param {object} args.address
 * @param {boolean} args.giftWrap
 * @param {string|null} args.couponCode
 * @param {(payload:object)=>Promise<any>} args.onVerify  calls the verify API
 * @returns {Promise<any>} the verify result (the created order)
 */
export async function payAndVerify({ orderResp, address, giftWrap, couponCode, onVerify }) {
  const { order, mode } = orderResp;

  // MOCK mode — no real gateway; verify straight away.
  if (mode === 'mock' || order.mock) {
    return onVerify({ razorpayOrderId: order.id, mock: true, address, giftWrap, couponCode });
  }

  const ok = await loadScript();
  if (!ok) throw new Error('Could not load the payment gateway. Check your connection.');

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: order.keyId,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      name: 'NameCraft',
      description: 'Custom name plate',
      prefill: { name: address.name, contact: address.phone },
      theme: { color: '#4f46e5' },
      handler: async (resp) => {
        try {
          resolve(
            await onVerify({
              razorpayOrderId: resp.razorpay_order_id,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
              address,
              giftWrap,
              couponCode,
            })
          );
        } catch (e) {
          reject(e);
        }
      },
      modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
    });
    rzp.open();
  });
}
