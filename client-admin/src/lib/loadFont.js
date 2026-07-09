// Dynamically load a Google font family (once) by injecting its stylesheet, so
// the font browser can preview any family and chosen fonts render everywhere —
// no build-time <link> needed. Safe to call repeatedly.

const requested = new Set();

export function ensureGoogleFont(family) {
  if (!family || typeof document === 'undefined') return;
  const fam = String(family).trim();
  if (!fam || requested.has(fam)) return;
  requested.add(fam);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fam).replace(/%20/g, '+')}&display=swap`;
  document.head.appendChild(link);
}

export default ensureGoogleFont;
