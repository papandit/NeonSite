// Public Neon Studio API — the live catalogue + a server price quote. The price
// shown is recomputed server-side again at cart-add (INVARIANT 2).

import { api } from './api';

export function getNeonConfig() {
  return api.get('/neon/config').then((r) => r.data.data);
}

export function quoteNeon(spec) {
  return api.post('/neon/quote', { spec }).then((r) => r.data.data);
}
