// Client money helpers. INVARIANT 1: money crosses the wire as integer paise;
// convert to rupees ONLY for display.

export function paiseToRupees(paise) {
  return (Number(paise) || 0) / 100;
}

export function rupeesToPaise(rupees) {
  return Math.round((Number(rupees) || 0) * 100);
}

/** Format integer paise for display, e.g. 149900 -> "₹1,499.00". */
export function formatPaise(paise, { currency = 'INR', locale = 'en-IN' } = {}) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(paiseToRupees(paise));
}
