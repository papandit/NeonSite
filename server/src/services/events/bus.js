// Tiny Server-Sent Events hub. Admin catalog writes broadcast a 'catalog:changed'
// event; storefront clients listen and refetch, so newly added items appear
// without a manual reload.

const clients = new Set();

export function addClient(res) {
  clients.add(res);
}

export function removeClient(res) {
  clients.delete(res);
}

/**
 * Broadcast an SSE event to all connected clients.
 * @param {string} event event name
 * @param {object} [data]
 */
export function broadcast(event, data = {}) {
  const frame = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) {
    try {
      res.write(frame);
    } catch {
      clients.delete(res);
    }
  }
}

export function clientCount() {
  return clients.size;
}
