// Email templates. Money formatted at the edge (rupees for humans).

const rupees = (paise) => `₹${((paise || 0) / 100).toFixed(2)}`;

const shell = (title, body) => `
  <div style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
    <div style="background:#4f46e5;color:#fff;padding:16px 24px;border-radius:8px 8px 0 0">
      <strong style="font-size:18px">NameCraft</strong>
    </div>
    <div style="border:1px solid #e5e7eb;border-top:0;padding:24px;border-radius:0 0 8px 8px">
      <h2 style="margin:0 0 12px">${title}</h2>
      ${body}
    </div>
  </div>`;

export function orderConfirmation(order) {
  const rows = order.items
    .map((it) => `<tr><td style="padding:6px 0">${it.productNameSnapshot} × ${it.quantity}</td><td style="text-align:right">${rupees(it.lineTotalPaise)}</td></tr>`)
    .join('');
  return {
    subject: `Order ${order.orderNumber} confirmed`,
    html: shell(
      'Thank you for your order!',
      `<p>Your order <strong>${order.orderNumber}</strong> is confirmed and payment was verified.</p>
       <table style="width:100%;border-collapse:collapse;margin:12px 0">
         ${rows}
         <tr><td style="padding-top:8px;border-top:1px solid #e5e7eb"><strong>Total</strong></td><td style="text-align:right;padding-top:8px;border-top:1px solid #e5e7eb"><strong>${rupees(order.totalPaise)}</strong></td></tr>
       </table>
       <p>We'll email you as your order moves through production.</p>`
    ),
    text: `Order ${order.orderNumber} confirmed. Total ${rupees(order.totalPaise)}.`,
  };
}

const STATUS_COPY = {
  design_review: 'Your design is under review. We\'ll confirm the artwork before manufacturing.',
  approved: 'Your design has been approved and will go into production.',
  manufacturing: 'Your name plate is being manufactured.',
  packed: 'Your order is packed and ready to ship.',
  shipped: 'Your order has shipped!',
  delivered: 'Your order has been delivered. We hope you love it!',
  cancelled: 'Your order has been cancelled.',
  confirmed: 'Your order is confirmed.',
};

export function statusUpdate(order, status, note) {
  const copy = STATUS_COPY[status] || `Your order status is now "${status}".`;
  const isReview = status === 'design_review';
  return {
    subject: isReview
      ? `Design review for order ${order.orderNumber}`
      : `Order ${order.orderNumber}: ${status.replace('_', ' ')}`,
    html: shell(
      isReview ? 'Design approval needed' : 'Order update',
      `<p>Order <strong>${order.orderNumber}</strong></p>
       <p>${copy}</p>
       ${note ? `<p style="color:#6b7280"><em>Note: ${note}</em></p>` : ''}`
    ),
    text: `Order ${order.orderNumber}: ${status}. ${copy}${note ? ` Note: ${note}` : ''}`,
  };
}
