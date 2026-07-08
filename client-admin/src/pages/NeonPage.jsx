// Neon Studio admin — full CRUD for the neon catalogue that powers the
// storefront customizer: fonts, colours, sizes (with paise pricing), backings
// and preview scenes. Add / edit / reorder / delete every row, then Save. Money
// is edited in rupees and stored as integer paise (INVARIANT 1). Saving
// broadcasts SSE so the live Neon page updates.

import { useEffect, useState } from 'react';
import { neonApi } from '../services/ops';
import { apiErrorMessage } from '../services/api';
import { paiseToRupees, rupeesToPaise } from '../utils/money';
import PageHeader from '../components/PageHeader';
import FileUpload from '../components/FileUpload';
import { NEON_FONT_LIBRARY } from '../config/neonFontLibrary';

// A generic editable table of records. columns: [{ key, label, type, width }]
// type ∈ text | number | money | color | bool.
function RowEditor({ title, description, items, columns, onChange, makeEmpty, addLabel, headerAction }) {
  const list = Array.isArray(items) ? items : [];
  const setCell = (i, key, val) => onChange(list.map((it, idx) => (idx === i ? { ...it, [key]: val } : it)));
  const remove = (i) => onChange(list.filter((_, idx) => idx !== i));
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const cell = (it, i, col) => {
    const v = it[col.key];
    if (col.type === 'bool') {
      return (
        <input type="checkbox" checked={Boolean(v)} onChange={(e) => setCell(i, col.key, e.target.checked)} className="h-4 w-4" />
      );
    }
    if (col.type === 'color') {
      return (
        <div className="flex items-center gap-1.5">
          <input type="color" value={v || '#000000'} onChange={(e) => setCell(i, col.key, e.target.value)} className="h-8 w-9 rounded border border-slate-300" />
          <input value={v || ''} onChange={(e) => setCell(i, col.key, e.target.value)} className="w-20 rounded-md border border-slate-300 px-1.5 py-1 text-xs" />
        </div>
      );
    }
    if (col.type === 'money') {
      return (
        <input
          type="number" step="0.01" min="0"
          value={v === '' || v == null ? '' : paiseToRupees(v)}
          onChange={(e) => setCell(i, col.key, e.target.value === '' ? 0 : rupeesToPaise(e.target.value))}
          className="w-24 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      );
    }
    if (col.type === 'image') {
      return (
        <div className="w-52">
          <FileUpload kind="image" folder="neon-scenes" label="" value={v || ''} onChange={(url) => setCell(i, col.key, url)} />
        </div>
      );
    }
    return (
      <input
        type={col.type === 'number' ? 'number' : 'text'}
        value={v ?? ''}
        onChange={(e) => setCell(i, col.key, col.type === 'number' ? Number(e.target.value) : e.target.value)}
        className="w-full min-w-[90px] rounded-md border border-slate-300 px-2 py-1.5 text-sm"
      />
    );
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-800">{title}</h3>
          {description && <p className="text-xs text-slate-400">{description}</p>}
        </div>
        {headerAction}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
              {columns.map((c) => <th key={c.key} className="px-2 pb-2 font-medium">{c.label}</th>)}
              <th className="px-2 pb-2" />
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr><td colSpan={columns.length + 1} className="px-2 py-4 text-slate-400">No rows yet.</td></tr>
            )}
            {list.map((it, i) => (
              <tr key={i} className="border-t border-slate-100">
                {columns.map((c) => <td key={c.key} className="px-2 py-2 align-middle">{cell(it, i, c)}</td>)}
                <td className="px-2 py-2 text-right align-middle whitespace-nowrap">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded px-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30">↑</button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1} className="rounded px-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30">↓</button>
                  <button type="button" onClick={() => remove(i)} className="ml-1 rounded px-2 text-xs font-medium text-red-600 hover:bg-red-50">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" onClick={() => onChange([...list, makeEmpty()])} className="mt-3 rounded-full border border-dashed border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50">
        + {addLabel}
      </button>
    </section>
  );
}

// Simple visual font picker — the admin just taps which library fonts to offer;
// each is previewed in its real typeface. No key / CSS-family editing.
function FontPicker({ fonts, onChange }) {
  const selected = new Set((fonts || []).filter((f) => f.active !== false).map((f) => f.key));
  const rebuild = (keys) => NEON_FONT_LIBRARY.filter((l) => keys.has(l.key)).map((l) => ({ ...l, active: true }));
  const toggle = (key) => {
    const keys = new Set(selected);
    if (keys.has(key)) keys.delete(key); else keys.add(key);
    onChange(rebuild(keys));
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-800">Fonts</h3>
          <p className="text-xs text-slate-400">Tap a style to offer it in the studio · {selected.size} of {NEON_FONT_LIBRARY.length} selected.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => onChange(rebuild(new Set(NEON_FONT_LIBRARY.map((l) => l.key))))} className="rounded-full border border-indigo-300 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50">Select all</button>
          <button type="button" onClick={() => onChange([])} className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-50">Clear</button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {NEON_FONT_LIBRARY.map((f) => {
          const on = selected.has(f.key);
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => toggle(f.key)}
              className={`relative rounded-xl border p-3 text-center transition ${on ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
            >
              {on && <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs text-white">✓</span>}
              <span className="block truncate text-2xl leading-tight text-slate-800" style={{ fontFamily: f.cssFamily }}>{f.name}</span>
              <span className="mt-1 block text-[11px] text-slate-400">{f.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function NeonPage() {
  const [cfg, setCfg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    neonApi.get()
      .then((c) => setCfg({
        maxChars: c.maxChars,
        fonts: c.fonts || [], colors: c.colors || [], sizes: c.sizes || [],
        backings: c.backings || [], adapters: c.adapters || [], scenes: c.scenes || [],
      }))
      .catch((e) => setError(apiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const set = (key, val) => { setCfg((c) => ({ ...c, [key]: val })); setSaved(false); };

  const onSave = async () => {
    setSaving(true); setSaved(false); setError(null);
    try {
      await neonApi.update(cfg);
      setSaved(true);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-slate-400">Loading neon catalogue…</div>;
  if (!cfg) return <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>;

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Neon Studio"
        subtitle="Manage the fonts, colours, sizes and backings customers use to build neon signs."
        action={
          <button onClick={onSave} disabled={saving} className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
            {saving ? 'Saving…' : 'Save catalogue'}
          </button>
        }
      />

      {error && <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {saved && <div className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">Neon catalogue saved — live on the storefront.</div>}

      <div className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <label className="block text-sm font-medium text-slate-700">Max characters</label>
          <input type="number" min="1" max="200" value={cfg.maxChars}
            onChange={(e) => set('maxChars', Number(e.target.value))}
            className="mt-1 w-32 rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </section>

        <FontPicker fonts={cfg.fonts} onChange={(v) => set('fonts', v)} />

        <RowEditor
          title="Colours" description="Fill = inner tube colour, Glow = outer halo."
          items={cfg.colors} onChange={(v) => set('colors', v)}
          makeEmpty={() => ({ key: '', name: '', fill: '#ffc9e6', glow: '#ff2d95', active: true })}
          addLabel="Add colour"
          columns={[
            { key: 'key', label: 'Key', type: 'text' },
            { key: 'name', label: 'Name', type: 'text' },
            { key: 'fill', label: 'Fill', type: 'color' },
            { key: 'glow', label: 'Glow', type: 'color' },
            { key: 'active', label: 'Active', type: 'bool' },
          ]}
        />

        <RowEditor
          title="Sizes" description="Price = base ₹ + (per-char ₹ × non-space characters). cm is the sign width."
          items={cfg.sizes} onChange={(v) => set('sizes', v)}
          makeEmpty={() => ({ key: '', name: '', cm: 60, basePricePaise: 260000, perCharPaise: 13000, fontSizePx: 46, active: true })}
          addLabel="Add size"
          columns={[
            { key: 'key', label: 'Key', type: 'text' },
            { key: 'name', label: 'Name', type: 'text' },
            { key: 'cm', label: 'Width (cm)', type: 'number' },
            { key: 'basePricePaise', label: 'Base (₹)', type: 'money' },
            { key: 'perCharPaise', label: 'Per char (₹)', type: 'money' },
            { key: 'fontSizePx', label: 'Font px', type: 'number' },
            { key: 'active', label: 'Active', type: 'bool' },
          ]}
        />

        <RowEditor
          title="Backings" description="Backboard styles; each adds an optional price."
          items={cfg.backings} onChange={(v) => set('backings', v)}
          makeEmpty={() => ({ key: '', name: '', priceDeltaPaise: 0, active: true })}
          addLabel="Add backing"
          columns={[
            { key: 'key', label: 'Key', type: 'text' },
            { key: 'name', label: 'Name', type: 'text' },
            { key: 'priceDeltaPaise', label: 'Extra (₹)', type: 'money' },
            { key: 'active', label: 'Active', type: 'bool' },
          ]}
        />

        <RowEditor
          title="Power adapters" description="Regional plug types the sign can ship with. Add an optional price per type."
          items={cfg.adapters} onChange={(v) => set('adapters', v)}
          makeEmpty={() => ({ key: '', name: '', priceDeltaPaise: 0, active: true })}
          addLabel="Add adapter"
          columns={[
            { key: 'key', label: 'Key', type: 'text' },
            { key: 'name', label: 'Name', type: 'text' },
            { key: 'priceDeltaPaise', label: 'Extra (₹)', type: 'money' },
            { key: 'active', label: 'Active', type: 'bool' },
          ]}
        />

        <RowEditor
          title="Preview scenes" description="Backdrops shown behind the sign. Upload a background image (a room, wall, brick…) and it shows in the live preview."
          items={cfg.scenes} onChange={(v) => set('scenes', v)}
          makeEmpty={() => ({ key: '', name: '', imageUrl: '', active: true })}
          addLabel="Add scene"
          columns={[
            { key: 'key', label: 'Key', type: 'text' },
            { key: 'name', label: 'Name', type: 'text' },
            { key: 'imageUrl', label: 'Background image', type: 'image' },
            { key: 'active', label: 'Active', type: 'bool' },
          ]}
        />

        <div className="flex justify-end">
          <button onClick={onSave} disabled={saving} className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
            {saving ? 'Saving…' : 'Save catalogue'}
          </button>
        </div>
      </div>
    </div>
  );
}
