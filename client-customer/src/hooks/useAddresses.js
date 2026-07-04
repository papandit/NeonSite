// Saved addresses in localStorage (per-user address book lands server-side in a
// later pass; this keeps checkout + the dashboard working now).

import { useCallback, useEffect, useState } from 'react';

const KEY = 'nc_addresses';

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function useAddresses() {
  const [addresses, setAddresses] = useState(read);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(addresses));
  }, [addresses]);

  const add = useCallback((addr) => {
    const id = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    setAddresses((list) => [...list, { ...addr, id }]);
    return id;
  }, []);

  const remove = useCallback((id) => {
    setAddresses((list) => list.filter((a) => a.id !== id));
  }, []);

  return { addresses, add, remove };
}
