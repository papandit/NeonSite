// Public SSE stream. Storefront clients subscribe here and refetch on
// 'catalog:changed'. Heartbeats keep the connection alive through proxies.

import { Router } from 'express';
import { addClient, removeClient } from '../services/events/bus.js';

const router = Router();

router.get('/', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();
  res.write(': connected\n\n');

  addClient(res);

  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      /* ignore */
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    removeClient(res);
    res.end();
  });
});

export default router;
