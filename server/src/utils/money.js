// Money utilities. INVARIANT 1: all money is integer paise. Rupees appear ONLY
// at the display edge. Never do float math on money elsewhere.

/**
 * True if value is a safe, non-negative integer number of paise.
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidPaise(value) {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    Number.isSafeInteger(value) &&
    value >= 0
  );
}

/**
 * Convert rupees (a human-entered decimal) to integer paise.
 * Rounds half-up to the nearest paise. Use ONLY at the input edge
 * (e.g. an admin typing a price in rupees).
 * @param {number|string} rupees
 * @returns {number} integer paise
 */
export function rupeesToPaise(rupees) {
  const n = typeof rupees === 'string' ? Number(rupees) : rupees;
  if (typeof n !== 'number' || Number.isNaN(n) || !Number.isFinite(n)) {
    throw new TypeError(`rupeesToPaise: expected a finite number, got ${rupees}`);
  }
  if (n < 0) {
    throw new RangeError(`rupeesToPaise: amount cannot be negative (${rupees})`);
  }
  // Multiply in a way that avoids classic float drift (e.g. 19.99 * 100).
  return Math.round(n * 100);
}

/**
 * Convert integer paise to a rupees Number. Use ONLY at the display edge.
 * @param {number} paise
 * @returns {number} rupees (may have up to 2 decimals)
 */
export function paiseToRupees(paise) {
  if (!isValidPaise(paise)) {
    throw new TypeError(`paiseToRupees: expected non-negative integer paise, got ${paise}`);
  }
  return paise / 100;
}

/**
 * Format integer paise as a display string, e.g. 149900 -> "₹1,499.00".
 * @param {number} paise
 * @param {object} [opts]
 * @param {string} [opts.currency='INR']
 * @param {string} [opts.locale='en-IN']
 * @returns {string}
 */
export function formatPaise(paise, { currency = 'INR', locale = 'en-IN' } = {}) {
  const rupees = paiseToRupees(paise);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}
