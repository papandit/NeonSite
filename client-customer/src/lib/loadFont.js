// Dynamically load a Google font family (once) so any admin-chosen font renders
// on the storefront even if it isn't in the static preload. Returns a promise
// that resolves when the font is ready (for canvas re-renders).

const requested = new Set();

export function ensureGoogleFont(family) {
  if (!family || typeof document === 'undefined') return Promise.resolve();
  const fam = String(family).trim();
  if (!fam) return Promise.resolve();
  if (!requested.has(fam)) {
    requested.add(fam);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fam).replace(/%20/g, '+')}&display=swap`;
    document.head.appendChild(link);
  }
  // Best-effort readiness for Fabric re-renders.
  if (document.fonts?.load) {
    return document.fonts.load(`16px '${fam}'`).catch(() => {});
  }
  return Promise.resolve();
}

export default ensureGoogleFont;
