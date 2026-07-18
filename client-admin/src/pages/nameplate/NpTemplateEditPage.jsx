// Name Plate template editor (Phase 1 — form based). Defines the base plate,
// dynamic text fields (fully admin-controlled), allowed options, dimensions and
// price. A visual Fabric canvas builder lands in Phase 2; text-field positions
// are numeric (0..1) here so templates are already fully functional.

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { resource } from '../../services/resourceApi';
import { apiErrorMessage } from '../../services/api';
import { paiseToRupees, rupeesToPaise } from '../../utils/money';
import { ensureGoogleFont } from '../../lib/loadFont';
import PageHeader from '../../components/PageHeader';
import FileUpload from '../../components/FileUpload';
import TemplateCanvasBuilder from './TemplateCanvasBuilder';

// Image/thumbnail URL for a symbol-like option (element / icon / shape).
const optionImg = (o) => o?.meta?.image || o?.meta?.svg || o?.imageUrl || o?.svg || o?.meta?.thumbnail || '';
const SYMBOL_KINDS = ['elements', 'icons', 'shapes'];

const templates = resource('nameplate/templates');
const ALLOW_KINDS = [
  ['fonts', 'allowedFonts', 'Fonts'],
  ['colors', 'allowedColors', 'Colors'],
  ['elements', 'allowedElements', 'Elements'],
  ['sizes', 'allowedSizes', 'Sizes'],
  ['backgrounds', 'allowedBackgrounds', 'Backgrounds'],
];

const CAPS = [
  ['canMove', 'Move'], ['canResize', 'Resize'], ['canRotate', 'Rotate'],
  ['canChangeColor', 'Color'], ['canChangeFont', 'Font'], ['canChangeSize', 'Size'],
  ['canBold', 'Bold'], ['canItalic', 'Italic'], ['canOutline', 'Outline'], ['canShadow', 'Shadow'],
];

const emptyField = () => ({
  key: '', label: '', placeholder: '', defaultValue: '', required: false,
  minLength: 0, maxLength: 40, defaultSizePx: 40, defaultColorHex: '#1a1a1a',
  x: 0.5, y: 0.5, rotation: 0, align: 'center',
  canMove: true, canResize: true, canRotate: false, canChangeColor: true,
  canChangeFont: true, canChangeSize: true, canBold: true, canItalic: true,
  canOutline: false, canShadow: false, status: 'active',
});

const empty = () => ({
  name: '', category: '', status: 'draft',
  previewImageUrl: '', basePlateImageUrl: '', transparentPngUrl: '',
  widthMm: 300, heightMm: 150, baseRupees: 0, compareRupees: '',
  symbolEnabled: true, symbolScale: 0.2, symbolX: 0.5, symbolY: 0.2,
  textFields: [], ...Object.fromEntries(ALLOW_KINDS.map(([, a]) => [a, []])),
});

export default function NpTemplateEditPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [tpl, setTpl] = useState(empty());
  const [cats, setCats] = useState([]);
  const [options, setOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, ...optRes] = await Promise.all([
        resource('nameplate/categories').list({ limit: 200 }),
        ...ALLOW_KINDS.map(([k]) => resource(`nameplate/${k}`).list({ limit: 200 })),
      ]);
      setCats(catRes.data);
      const optMap = {};
      ALLOW_KINDS.forEach(([k], i) => { optMap[k] = optRes[i].data; });
      setOptions(optMap);

      if (isEdit) {
        const t = await templates.get(id);
        setTpl({
          name: t.name, category: t.category?._id || t.category || '', status: t.status,
          previewImageUrl: t.previewImageUrl || '', basePlateImageUrl: t.basePlateImageUrl || '', transparentPngUrl: t.transparentPngUrl || '',
          widthMm: t.widthMm, heightMm: t.heightMm, baseRupees: paiseToRupees(t.basePricePaise),
          compareRupees: t.compareAtPricePaise ? paiseToRupees(t.compareAtPricePaise) : '',
          symbolEnabled: t.symbolEnabled !== false,
          symbolScale: t.symbolScale ?? 0.2, symbolX: t.symbolX ?? 0.5, symbolY: t.symbolY ?? 0.2,
          textFields: (t.textFields || []).map((f) => ({ ...emptyField(), ...f })),
          ...Object.fromEntries(ALLOW_KINDS.map(([, a]) => [a, (t[a] || []).map(String)])),
        });
      }
      setError(null);
    } catch (e) { setError(apiErrorMessage(e)); }
    finally { setLoading(false); }
  }, [id, isEdit]);

  useEffect(() => { load(); }, [load]);

  // Preview each font in its own typeface (load the family once it's known).
  useEffect(() => {
    (options.fonts || []).forEach((f) => ensureGoogleFont(f.meta?.family || f.name));
  }, [options.fonts]);

  const set = (k, v) => setTpl((t) => ({ ...t, [k]: v }));
  const toggleAllowed = (arrKey, optId) => setTpl((t) => {
    const cur = t[arrKey] || [];
    return { ...t, [arrKey]: cur.includes(optId) ? cur.filter((x) => x !== optId) : [...cur, optId] };
  });

  // Text field editor
  const addField = () => setTpl((t) => ({ ...t, textFields: [...t.textFields, emptyField()] }));
  const updField = (i, patch) => setTpl((t) => ({ ...t, textFields: t.textFields.map((f, idx) => idx === i ? { ...f, ...patch } : f) }));
  const removeField = (i) => setTpl((t) => ({ ...t, textFields: t.textFields.filter((_, idx) => idx !== i) }));

  const onSave = async () => {
    if (!tpl.name.trim()) { setError('Template name is required'); return; }
    setBusy(true); setError(null);
    try {
      const payload = {
        name: tpl.name, category: tpl.category || undefined, status: tpl.status,
        previewImageUrl: tpl.previewImageUrl, basePlateImageUrl: tpl.basePlateImageUrl, transparentPngUrl: tpl.transparentPngUrl,
        widthMm: Number(tpl.widthMm), heightMm: Number(tpl.heightMm),
        basePricePaise: rupeesToPaise(tpl.baseRupees || 0),
        compareAtPricePaise: tpl.compareRupees ? rupeesToPaise(tpl.compareRupees) : 0,
        symbolEnabled: Boolean(tpl.symbolEnabled),
        symbolScale: Number(tpl.symbolScale) || 0.2, symbolX: Number(tpl.symbolX), symbolY: Number(tpl.symbolY),
        textFields: tpl.textFields.filter((f) => f.key && f.label),
        ...Object.fromEntries(ALLOW_KINDS.map(([, a]) => [a, tpl[a]])),
      };
      if (isEdit) await templates.update(id, payload);
      else await templates.create(payload);
      navigate('/nameplate/templates');
    } catch (e) { setError(apiErrorMessage(e)); }
    finally { setBusy(false); }
  };

  if (loading) return <div className="text-slate-400">Loading…</div>;

  const input = 'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm';
  const cell = 'w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm';

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={isEdit ? 'Edit template' : 'New template'}
        subtitle="Define the base plate, the dynamic fields customers fill, and which options they can use."
        action={<button onClick={() => navigate('/nameplate/templates')} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Back</button>}
      />
      {error && <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="space-y-6">
        {/* Basics */}
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-4 font-semibold">Basics</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><label className="block text-sm font-medium text-slate-700">Name</label><input className={input} value={tpl.name} onChange={(e) => set('name', e.target.value)} /></div>
            <div><label className="block text-sm font-medium text-slate-700">Category</label>
              <select className={input} value={tpl.category} onChange={(e) => set('category', e.target.value)}>
                <option value="">—</option>
                {cats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-medium text-slate-700">Status</label>
              <select className={input} value={tpl.status} onChange={(e) => set('status', e.target.value)}>
                <option value="draft">draft</option><option value="active">active</option><option value="hidden">hidden</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="block text-sm font-medium text-slate-700">Selling price (₹)</label><input type="number" step="0.01" min="0" className={input} value={tpl.baseRupees} onChange={(e) => set('baseRupees', e.target.value)} /></div>
              <div><label className="block text-sm font-medium text-slate-700">Original / MRP (₹)</label><input type="number" step="0.01" min="0" placeholder="optional" title="Shows a struck-through price when higher than selling price" className={input} value={tpl.compareRupees} onChange={(e) => set('compareRupees', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="block text-sm font-medium text-slate-700">Width (mm)</label><input type="number" className={input} value={tpl.widthMm} onChange={(e) => set('widthMm', e.target.value)} /></div>
              <div><label className="block text-sm font-medium text-slate-700">Height (mm)</label><input type="number" className={input} value={tpl.heightMm} onChange={(e) => set('heightMm', e.target.value)} /></div>
            </div>
          </div>
        </section>

        {/* Images */}
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-4 font-semibold">Plate images</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <FileUpload label="Base plate image" kind="image" folder="nameplate/plates" value={tpl.basePlateImageUrl} onChange={(v) => set('basePlateImageUrl', v)} />
            <FileUpload label="Preview image" kind="image" folder="nameplate/plates" value={tpl.previewImageUrl} onChange={(v) => set('previewImageUrl', v)} />
            <FileUpload label="Transparent PNG" kind="image" folder="nameplate/plates" value={tpl.transparentPngUrl} onChange={(v) => set('transparentPngUrl', v)} />
          </div>
        </section>

        {/* Visual builder — drag / resize / rotate fields + symbol on the plate */}
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-1 font-semibold">Visual builder</h3>
          <p className="mb-3 text-xs text-slate-400">Drag to move, use the corner handles to resize (text = font size), and the top handle to rotate. Changes save straight to the template and the storefront renders the exact same layout.</p>
          <TemplateCanvasBuilder
            baseImageUrl={tpl.basePlateImageUrl}
            aspect={(Number(tpl.heightMm) || 150) / (Number(tpl.widthMm) || 300)}
            fields={tpl.textFields}
            onFieldChange={(i, patch) => updField(i, patch)}
            symbol={tpl.symbolEnabled ? { x: Number(tpl.symbolX), y: Number(tpl.symbolY), scale: Number(tpl.symbolScale) } : null}
            onSymbolChange={(p) => setTpl((t) => ({ ...t, symbolX: p.x ?? t.symbolX, symbolY: p.y ?? t.symbolY, symbolScale: p.scale ?? t.symbolScale }))}
          />
        </section>

        {/* Symbol placement */}
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="font-semibold">Symbol</h3>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-600">
              <input type="checkbox" checked={tpl.symbolEnabled} onChange={(e) => set('symbolEnabled', e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
              Offer a symbol on this plate
            </label>
          </div>
          <p className="mb-4 text-xs text-slate-400">
            {tpl.symbolEnabled
              ? <>Sets where the customer-chosen symbol sits — it always fits its box keeping its shape. Manage the symbols under <span className="font-medium text-slate-500">Name Plate Studio → Elements / Icons</span>.</>
              : 'No symbol slot — this plate is text-only. Turn it on to let customers add a symbol.'}
          </p>
          {tpl.symbolEnabled && (
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-slate-700">Size <span className="text-xs text-slate-400">{Math.round((Number(tpl.symbolScale) || 0.2) * 100)}% of width</span></label>
              <input type="range" min="0.05" max="0.6" step="0.01" value={tpl.symbolScale} onChange={(e) => set('symbolScale', Number(e.target.value))} className="mt-2 w-full accent-indigo-600" />
            </div>
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-slate-700">Horizontal <span className="text-xs text-slate-400">{Math.round((Number(tpl.symbolX) || 0) * 100)}%</span></label>
              <input type="range" min="0" max="1" step="0.01" value={tpl.symbolX} onChange={(e) => set('symbolX', Number(e.target.value))} className="mt-2 w-full accent-indigo-600" />
            </div>
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-slate-700">Vertical <span className="text-xs text-slate-400">{Math.round((Number(tpl.symbolY) || 0) * 100)}%</span></label>
              <input type="range" min="0" max="1" step="0.01" value={tpl.symbolY} onChange={(e) => set('symbolY', Number(e.target.value))} className="mt-2 w-full accent-indigo-600" />
            </div>
          </div>
          )}
        </section>

        {/* Text fields */}
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <div><h3 className="font-semibold">Dynamic text fields</h3><p className="text-xs text-slate-400">These are the ONLY inputs the customer sees. Fully admin-controlled.</p></div>
            <button type="button" onClick={addField} className="rounded-full bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-900">+ Add field</button>
          </div>
          {tpl.textFields.length === 0 && <p className="text-sm text-slate-400">No fields yet. Add ones like Name, House Number, Welcome Text.</p>}
          <div className="space-y-4">
            {tpl.textFields.map((f, i) => (
              <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Field #{i + 1}</span>
                  <button type="button" onClick={() => removeField(i)} className="text-xs font-medium text-red-600 hover:underline">Remove</button>
                </div>
                <div className="grid gap-2 sm:grid-cols-4">
                  <input placeholder="key (e.g. name)" className={cell} value={f.key} onChange={(e) => updField(i, { key: e.target.value })} />
                  <input placeholder="Label" className={cell} value={f.label} onChange={(e) => updField(i, { label: e.target.value })} />
                  <input placeholder="Placeholder" className={cell} value={f.placeholder} onChange={(e) => updField(i, { placeholder: e.target.value })} />
                  <input placeholder="Default value" className={cell} value={f.defaultValue} onChange={(e) => updField(i, { defaultValue: e.target.value })} />
                  <input type="number" placeholder="max len" title="Max length" className={cell} value={f.maxLength} onChange={(e) => updField(i, { maxLength: Number(e.target.value) })} />
                  <input type="number" placeholder="size px" title="Default size px" className={cell} value={f.defaultSizePx} onChange={(e) => updField(i, { defaultSizePx: Number(e.target.value) })} />
                  <div className="flex items-center gap-1"><span className="text-xs text-slate-400">colour</span><input type="color" value={f.defaultColorHex} onChange={(e) => updField(i, { defaultColorHex: e.target.value })} className="h-8 w-10 rounded border border-slate-300" /></div>
                  <select className={cell} value={f.align} onChange={(e) => updField(i, { align: e.target.value })}><option value="left">left</option><option value="center">center</option><option value="right">right</option></select>
                  <div className="flex items-center gap-1"><span className="text-xs text-slate-400">x</span><input type="number" step="0.01" min="0" max="1" className={cell} value={f.x} onChange={(e) => updField(i, { x: Number(e.target.value) })} /></div>
                  <div className="flex items-center gap-1"><span className="text-xs text-slate-400">y</span><input type="number" step="0.01" min="0" max="1" className={cell} value={f.y} onChange={(e) => updField(i, { y: Number(e.target.value) })} /></div>
                  <label className="flex items-center gap-1.5 text-sm text-slate-600"><input type="checkbox" checked={f.required} onChange={(e) => updField(i, { required: e.target.checked })} /> required</label>
                </div>
                <div className="mt-2 flex flex-wrap gap-3">
                  {CAPS.map(([k, label]) => (
                    <label key={k} className="flex items-center gap-1 text-xs text-slate-500"><input type="checkbox" checked={f[k]} onChange={(e) => updField(i, { [k]: e.target.checked })} /> {label}</label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Allowed options */}
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-1 font-semibold">Allowed options</h3>
          <p className="mb-4 text-xs text-slate-400">Pick which options this template exposes. Leave a group empty to allow ALL active items.</p>
          <div className="space-y-4">
            {ALLOW_KINDS.map(([k, arrKey, label]) => (
              <div key={k}>
                <div className="mb-1 text-sm font-medium text-slate-700">{label} <span className="text-xs text-slate-400">({(tpl[arrKey] || []).length ? `${tpl[arrKey].length} selected` : 'all'})</span></div>
                <div className="flex flex-wrap gap-2">
                  {(options[k] || []).length === 0 && <span className="text-xs text-slate-400">No {label.toLowerCase()} yet.</span>}
                  {(options[k] || []).map((o) => {
                    const sel = (tpl[arrKey] || []).includes(String(o._id));
                    const isFont = k === 'fonts';
                    const fam = o.meta?.family || o.name;
                    const img = SYMBOL_KINDS.includes(k) ? optionImg(o) : '';
                    return (
                      <button key={o._id} type="button" onClick={() => toggleAllowed(arrKey, String(o._id))} className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${sel ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}>
                        {o.meta?.hex && <span className="inline-block h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: o.meta.hex }} />}
                        {img && <span className="flex h-6 w-6 items-center justify-center rounded bg-white p-0.5 shadow-sm"><img src={img} alt="" className="max-h-full max-w-full object-contain" /></span>}
                        <span style={isFont ? { fontFamily: fam, fontSize: '15px' } : undefined}>{o.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/nameplate/templates')} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
          <button onClick={onSave} disabled={busy} className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">{busy ? 'Saving…' : isEdit ? 'Save changes' : 'Create template'}</button>
        </div>
      </div>
    </div>
  );
}
