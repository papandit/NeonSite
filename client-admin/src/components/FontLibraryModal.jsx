// A visual font-library picker. Shows the curated library as preview cards
// (each in its real typeface); the admin ticks the ones to add and confirms.
// Already-added families are shown as disabled/ticked. Reused by the Name Plate
// fonts page and anywhere fonts are added.

import { useState } from 'react';
import Modal from './Modal';
import { NEON_FONT_LIBRARY } from '../config/neonFontLibrary';

// Real family from a CSS family string, e.g. "'Dancing Script', cursive" -> "Dancing Script".
export const familyOf = (css) => css.match(/'([^']+)'/)?.[1] || css.split(',')[0].trim();

export default function FontLibraryModal({ open, onClose, existingFamilies = new Set(), onAddMany, busy }) {
  const [sel, setSel] = useState(new Set());

  const toggle = (fam) => setSel((s) => {
    const n = new Set(s);
    n.has(fam) ? n.delete(fam) : n.add(fam);
    return n;
  });

  const items = NEON_FONT_LIBRARY.map((f) => ({ ...f, family: familyOf(f.cssFamily) }));
  const addable = items.filter((f) => !existingFamilies.has(f.family));
  const allSelected = addable.length > 0 && addable.every((f) => sel.has(f.family));

  const confirm = async () => {
    if (sel.size === 0) return;
    await onAddMany([...sel]);
    setSel(new Set());
  };

  return (
    <Modal open={open} title="Add fonts from library" onClose={onClose}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-slate-500">Tap fonts to add · {sel.size} selected</p>
        <button
          type="button"
          onClick={() => setSel(allSelected ? new Set() : new Set(addable.map((f) => f.family)))}
          className="rounded-full border border-indigo-300 px-3 py-1 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
        >
          {allSelected ? 'Clear' : 'Select all'}
        </button>
      </div>

      <div className="grid max-h-[55vh] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
        {items.map((f) => {
          const added = existingFamilies.has(f.family);
          const on = sel.has(f.family);
          return (
            <button
              key={f.key}
              type="button"
              disabled={added}
              onClick={() => toggle(f.family)}
              className={`relative rounded-xl border p-3 text-center transition ${
                added ? 'cursor-default border-green-200 bg-green-50 opacity-70'
                  : on ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              {(added || on) && <span className={`absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-xs text-white ${added ? 'bg-green-500' : 'bg-indigo-600'}`}>✓</span>}
              <span className="block truncate text-xl leading-tight text-slate-800" style={{ fontFamily: f.family }}>{f.family}</span>
              <span className="mt-1 block text-[11px] text-slate-400">{added ? 'added' : f.family}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Close</button>
        <button type="button" onClick={confirm} disabled={busy || sel.size === 0} className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
          {busy ? 'Adding…' : `Add ${sel.size || ''} font${sel.size === 1 ? '' : 's'}`}
        </button>
      </div>
    </Modal>
  );
}
