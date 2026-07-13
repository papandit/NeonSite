// Saved addresses in localStorage (per-user address book lands server-side in a
// later pass; this keeps checkout + the dashboard working now). Addresses are
// de-duplicated: the same address (name/phone/lines/city/state/pincode) is only
// ever stored once — re-adding an identical one just returns the existing entry.

import { useCallback, useEffect, useState } from 'react';

const KEY = 'nc_addresses';

const norm = (s) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
const keyOf = (a) => ['name', 'phone', 'line1', 'line2', 'city', 'state', 'pincode'].map((k) => norm(a[k])).join('|');

function dedupe(list) {
  const seen = new Set();
  const out = [];
  for (const a of list) {
    const k = keyOf(a);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(a);
  }
  return out;
}

function read() {
  try {
    return dedupe(JSON.parse(localStorage.getItem(KEY) || '[]'));
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
    const k = keyOf(addr);
    let id;
    setAddresses((list) => {
      const existing = list.find((a) => keyOf(a) === k);
      if (existing) { id = existing.id; return list; } // already saved — no duplicate
      id = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
      return [...list, { ...addr, id }];
    });
    return id;
  }, []);

  const remove = useCallback((id) => {
    setAddresses((list) => list.filter((a) => a.id !== id));
  }, []);

  return { addresses, add, remove };
}
