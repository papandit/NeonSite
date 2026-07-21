// Configurator pricing + preview upload (server-authoritative).

import { api } from './api';

/** Ask the server for authoritative pricing. Returns the corrected designDocument. */
export function requestQuote(productId, designDocument) {
  return api
    .post('/pricing/quote', { productId, designDocument })
    .then((r) => r.data.data.designDocument);
}

/** Upload the browser preview (data URL) via the server. Returns { url, stored }. */
export function uploadPreview(dataUrl) {
  return api.post('/render/preview-upload', { dataUrl }).then((r) => r.data.data);
}

/** Upload a customer-supplied image (e.g. their own background). Returns { url }. */
export function uploadCustomerImage(dataUrl) {
  return api.post('/render/customer-upload', { dataUrl }).then((r) => r.data.data);
}
