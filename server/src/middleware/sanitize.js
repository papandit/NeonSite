// Strips MongoDB query operators out of anything the client sends.
//
// Mongoose casts most fields, so an object where a string is expected usually
// throws rather than executing — but that only holds where a schema type is
// enforced. Any query built from a raw body value, and every Mixed field
// (Settings.content, designDocument), has no such protection: a key like
// "$ne" or "$where" arriving in a body is a query the caller wrote, not data.
//
// Keys are dropped rather than renamed. Renaming ("$ne" -> "_ne") keeps a
// caller's structure and quietly changes its meaning; dropping makes the
// injected clause vanish so the query means exactly what the code says.
//
// `req.query` is a getter on the Express 5 request, so it is rebuilt with
// defineProperty rather than assigned to.

const FORBIDDEN = /^\$/;

function scrub(value, depth = 0) {
  if (depth > 12 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => scrub(v, depth + 1));

  const out = {};
  for (const [key, v] of Object.entries(value)) {
    // "$gt" is an operator; "a.b" is a path traversal into a nested doc.
    if (FORBIDDEN.test(key) || key.includes('.')) continue;
    out[key] = scrub(v, depth + 1);
  }
  return out;
}

export default function sanitizeRequest(req, _res, next) {
  if (req.body && typeof req.body === 'object') req.body = scrub(req.body);
  if (req.params && typeof req.params === 'object') req.params = scrub(req.params);
  if (req.query && typeof req.query === 'object') {
    const cleaned = scrub(req.query);
    Object.defineProperty(req, 'query', { value: cleaned, writable: true, configurable: true });
  }
  next();
}
