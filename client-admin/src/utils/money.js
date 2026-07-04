// Client money helpers. INVARIANT 1: money crosses the wire as integer paise;
// convert to rupees ONLY for display. Admin forms enter prices in rupees and
// convert to paise before sending (see Phase 1.5).

export function paiseToRupees(paise) {
  return (Number(paise) || 0) / 100;
}

export function rupeesToPaise(rupees) {
  return Math.round((Number(rupees) || 0) * 100);
}

export function formatPaise(paise, { currency = 'INR', locale = 'en-IN' } = {}) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(paiseToRupees(paise));
}
