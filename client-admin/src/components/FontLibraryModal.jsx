// A Google-Fonts / MS-Word-style font browser. Shows a big catalogue of family
// names; each previews in its real typeface (fonts load dynamically on demand).
// The admin searches, ticks the ones to add, and confirms — no CSS family or
// name typing. Already-added families are shown as disabled/ticked.

import { useEffect, useMemo, useState } from 'react';
import Modal from './Modal';
import { GOOGLE_FONTS_SORTED } from '../config/googleFonts';
import { ensureGoogleFont } from '../lib/loadFont';

const MAX_SHOWN = 90; // cap rendered previews for performance

function FontCard({ family, added, on, onToggle }) {
  useEffect(() => { ensureGoogleFont(family); }, [family]);
  return (
    <button
      type="button"
      disabled={added}
      onClick={() => onToggle(family)}
      className={`relative rounded-xl border p-3 text-left transition ${
        added ? 'cursor-default border-green-200 bg-green-50 opacity-70'
          : on ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      {(added || on) && <span className={`absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-xs text-white ${added ? 'bg-green-500' : 'bg-indigo-600'}`}>✓</span>}
      <span className="block truncate text-xl leading-tight text-slate-800" style={{ fontFamily: `'${family}', sans-serif` }}>{family}</span>
      <span className="mt-1 block truncate text-[11px] text-slate-400">{added ? 'added' : family}</span>
    </button>
  );
}

export default function FontLibraryModal({ open, onClose, existingFamilies = new Set(), onAddMany, busy }) {
  const [sel, setSel] = useState(new Set());
  const [q, setQ] = useState('');

  const toggle = (fam) => setSel((s) => {
    const n = new Set(s);
    n.has(fam) ? n.delete(fam) : n.add(fam);
    return n;
  });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = needle ? GOOGLE_FONTS_SORTED.filter((f) => f.toLowerCase().includes(needle)) : GOOGLE_FONTS_SORTED;
    return list;
  }, [q]);
  const shown = filtered.slice(0, MAX_SHOWN);

  const confirm = async () => {
    if (sel.size === 0) return;
    await onAddMany([...sel]);
    setSel(new Set());
    setQ('');
  };

  return (
    <Modal open={open} title="Add fonts from the library" onClose={onClose}>
      <div className="mb-3 flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${GOOGLE_FONTS_SORTED.length}+ fonts…`}
          className="flex-1 rounded-full border border-slate-300 px-4 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <span className="shrink-0 text-xs text-slate-400">{sel.size} selected</span>
      </div>

      <div className="grid max-h-[55vh] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
        {shown.map((fam) => (
          <FontCard key={fam} family={fam} added={existingFamilies.has(fam)} on={sel.has(fam)} onToggle={toggle} />
        ))}
      </div>
      {filtered.length > MAX_SHOWN && (
        <p className="mt-2 text-center text-xs text-slate-400">Showing {MAX_SHOWN} of {filtered.length} — type to narrow the list.</p>
      )}

      <div className="mt-4 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Close</button>
        <button type="button" onClick={confirm} disabled={busy || sel.size === 0} className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
          {busy ? 'Adding…' : `Add ${sel.size || ''} font${sel.size === 1 ? '' : 's'}`}
        </button>
      </div>
    </Modal>
  );
}
