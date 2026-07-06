// Inline creator for a customization option (colour, size, font, icon, …).
// Lets the admin add a brand-new option straight from the Product Builder — it
// saves to the shared option collection (POST /api/admin/<collKey>) and hands
// the created option back so the builder can auto-select it on this product.

import { useState } from 'react';
import { resource } from '../services/resourceApi';
import { apiErrorMessage } from '../services/api';
import { rupeesToPaise } from '../utils/money';
import FileUpload from './FileUpload';

const emptyMeta = (metaFields) =>
  Object.fromEntries((metaFields || []).map((f) => [f.name, f.type === 'color' ? '#000000' : '']));

export default function InlineOptionCreator({ collKey, label, metaFields = [], onCreated }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [priceRupees, setPriceRupees] = useState('');
  const [meta, setMeta] = useState(() => emptyMeta(metaFields));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const reset = () => {
    setName('');
    setPriceRupees('');
    setMeta(emptyMeta(metaFields));
    setError(null);
  };

  const setMetaField = (key, val) => setMeta((m) => ({ ...m, [key]: val }));

  const submit = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    setBusy(true);
    setError(null);
    try {
      // Drop empty meta keys; coerce number fields so widthMm etc. store as ints.
      const numberKeys = new Set(metaFields.filter((f) => f.type === 'number').map((f) => f.name));
      const cleanMeta = Object.fromEntries(
        Object.entries(meta)
          .filter(([, v]) => v !== '' && v != null)
          .map(([k, v]) => [k, numberKeys.has(k) ? Number(v) : v])
      );
      const created = await resource(collKey).create({
        name: name.trim(),
        priceDeltaPaise: rupeesToPaise(priceRupees || 0),
        meta: cleanMeta,
        status: 'active',
      });
      onCreated?.(created);
      reset();
      setOpen(false);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not create option'));
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-dashed border-indigo-300 px-3 py-1 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
      >
        + Add new {label.toLowerCase()}
      </button>
    );
  }

  return (
    <div className="w-full rounded-lg border border-indigo-200 bg-white p-3">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-600">New {label.toLowerCase()}</div>
      {error && <div className="mb-2 rounded bg-red-50 px-2 py-1 text-xs text-red-700">{error}</div>}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">Name *</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" placeholder={`e.g. Matte Black`} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">Price delta (₹)</span>
          <input type="number" step="0.01" min="0" value={priceRupees} onChange={(e) => setPriceRupees(e.target.value)} className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" placeholder="0" />
        </label>

        {metaFields.map((f) => {
          if (f.type === 'color') {
            return (
              <label key={f.name} className="block">
                <span className="mb-1 block text-xs font-medium text-slate-500">{f.label}</span>
                <div className="flex items-center gap-2">
                  <input type="color" value={meta[f.name] || '#000000'} onChange={(e) => setMetaField(f.name, e.target.value)} className="h-9 w-12 rounded border border-slate-300" />
                  <input value={meta[f.name] || ''} onChange={(e) => setMetaField(f.name, e.target.value)} className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" placeholder="#000000" />
                </div>
              </label>
            );
          }
          if (f.type === 'font' || f.type === 'svg' || f.type === 'image') {
            return (
              <div key={f.name} className="sm:col-span-2">
                <FileUpload label={f.label} kind={f.type} folder={collKey} value={meta[f.name] || ''} onChange={(v) => setMetaField(f.name, v)} />
              </div>
            );
          }
          return (
            <label key={f.name} className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500">{f.label}</span>
              <input type={f.type === 'number' ? 'number' : 'text'} value={meta[f.name] || ''} onChange={(e) => setMetaField(f.name, e.target.value)} className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
            </label>
          );
        })}
      </div>

      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={() => { reset(); setOpen(false); }} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
        <button type="button" onClick={submit} disabled={busy} className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
          {busy ? 'Saving…' : 'Save & attach'}
        </button>
      </div>
    </div>
  );
}
