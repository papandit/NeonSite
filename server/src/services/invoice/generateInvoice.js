// PDF invoice with GST + HSN (pdfkit). Returns a Buffer so it's easy to stream
// or test. GST is split CGST/SGST (intra-state default).

import PDFDocument from 'pdfkit';

const rupees = (paise) => `INR ${((paise || 0) / 100).toFixed(2)}`;

/**
 * @param {object} order lean order
 * @param {object} settings store settings
 * @returns {Promise<Buffer>}
 */
export function generateInvoiceBuffer(order, settings) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const hsn = settings.hsnCode || '8306';

    // Header
    doc.fontSize(20).fillColor('#4f46e5').text(settings.storeName || 'NameCraft', { continued: false });
    doc.fontSize(9).fillColor('#666').text(settings.storeAddress || '');
    if (settings.gstin) doc.text(`GSTIN: ${settings.gstin}`);
    doc.moveDown();

    doc.fillColor('#000').fontSize(16).text('Tax Invoice', { align: 'right' });
    doc.fontSize(10).fillColor('#444')
      .text(`Invoice: ${order.orderNumber}`, { align: 'right' })
      .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, { align: 'right' });
    doc.moveDown();

    // Bill to
    doc.fillColor('#000').fontSize(11).text('Bill To:', { underline: true });
    doc.fontSize(10).fillColor('#444')
      .text(order.address?.name || '')
      .text(`${order.address?.line1 || ''}${order.address?.line2 ? ', ' + order.address.line2 : ''}`)
      .text(`${order.address?.city || ''}, ${order.address?.state || ''} ${order.address?.pincode || ''}`)
      .text(order.address?.phone || '');
    doc.moveDown();

    // Line items table
    const top = doc.y;
    doc.fontSize(9).fillColor('#000');
    doc.text('Item', 50, top).text('HSN', 280, top).text('Qty', 340, top).text('Rate', 390, top).text('Amount', 470, top);
    doc.moveTo(50, top + 14).lineTo(545, top + 14).strokeColor('#ccc').stroke();

    let y = top + 20;
    for (const it of order.items) {
      doc.fillColor('#333').fontSize(9);
      doc.text(String(it.productNameSnapshot || '').slice(0, 40), 50, y, { width: 220 });
      doc.text(hsn, 280, y);
      doc.text(String(it.quantity), 340, y);
      doc.text(rupees(it.unitPricePaise), 390, y);
      doc.text(rupees(it.lineTotalPaise), 470, y);
      y += 20;
    }
    doc.moveTo(50, y).lineTo(545, y).strokeColor('#ccc').stroke();
    y += 10;

    // Totals — GST split CGST/SGST
    const half = Math.floor(order.taxPaise / 2);
    const cgst = half;
    const sgst = order.taxPaise - half;
    const rate = settings.gstRatePercent || 0;

    const line = (label, value) => {
      doc.fontSize(9).fillColor('#444').text(label, 380, y).text(value, 470, y);
      y += 16;
    };
    line('Subtotal', rupees(order.subtotalPaise));
    if (order.discountPaise > 0) line('Discount', `- ${rupees(order.discountPaise)}`);
    line(`CGST (${rate / 2}%)`, rupees(cgst));
    line(`SGST (${rate / 2}%)`, rupees(sgst));
    line('Shipping', order.shippingPaise === 0 ? 'Free' : rupees(order.shippingPaise));
    doc.fontSize(11).fillColor('#000').text('Total', 380, y).text(rupees(order.totalPaise), 470, y);

    doc.fontSize(8).fillColor('#999').text('This is a computer-generated invoice.', 50, 780, { align: 'center' });

    doc.end();
  });
}

export default generateInvoiceBuffer;
