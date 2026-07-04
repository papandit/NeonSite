// Local, visual-only wishlist backed by localStorage. A real per-user wishlist
// lands in Phase 6; this keeps the heart toggle working meanwhile.

import { useCallback, useEffect, useState } from 'react';

const KEY = 'nc_wishlist';

function read() {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) || '[]'));
  } catch {
    return new Set();
  }
}

export function useWishlist() {
  const [ids, setIds] = useState(() => read());

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify([...ids]));
  }, [ids]);

  const toggle = useCallback((id) => {
    setIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const has = useCallback((id) => ids.has(id), [ids]);

  return { has, toggle, count: ids.size };
}
