// Subscribes to the backend SSE stream and calls `onChange` (debounced) when the
// admin changes the catalog — so newly added products/categories appear on the
// storefront without a manual reload. The browser auto-reconnects on drop.

import { useEffect, useRef } from 'react';
import { API_BASE_URL } from '../services/api';

export function useLiveCatalog(onChange) {
  const cb = useRef(onChange);
  cb.current = onChange;

  useEffect(() => {
    const base = API_BASE_URL.replace(/\/$/, '');
    let timer;
    const es = new EventSource(`${base}/events`);
    const handler = () => {
      clearTimeout(timer);
      timer = setTimeout(() => cb.current?.(), 400);
    };
    es.addEventListener('catalog:changed', handler);
    es.onerror = () => {}; // EventSource reconnects automatically

    return () => {
      clearTimeout(timer);
      es.close();
    };
  }, []);
}
