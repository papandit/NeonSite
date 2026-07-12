// Name Plate Designer — a framed, Canva-style customizer driven entirely by the
// admin template. The frame is fixed; the admin-defined text fields sit in their
// slots and AUTO-FIT (no dragging). The customer just edits the text, picks a
// font (preview grid), a colour, and an optional symbol — then buys. The design
// + preview freeze into the order (INVARIANT 2: price recomputed server-side).

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import * as fabric from 'fabric';
import { getNpTemplate, quoteNpDesign } from '../services/nameplate';
import { ensureGoogleFont } from '../lib/loadFont';
import { uploadPreview } from '../services/pricing';
import { addNameplateToCart } from '../store/cartSlice';
import { selectIsAuthenticated } from '../store/authSlice';
import { formatPaise } from '../utils/money';
import { apiErrorMessage } from '../services/api';
import Seo from '../components/Seo';

export const PENDING_NAMEPLATE_KEY = 'nc_pending_nameplate';
const CANVAS_W = 560;

const elImg = (e) => e?.meta?.image || e?.imageUrl || e?.meta?.svg || e?.svg;

export default function NamePlateDesignerPage() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthed = useSelector(selectIsAuthenticated);

  const [data, setData] = useState(null);          // { template, options }
  const [fields, setFields] = useState({});         // { fieldKey: value }
  const [font, setFont] = useState('');             // global family
  const [color, setColor] = useState('#c8a04d');    // global colour
  const [symbolId, setSymbolId] = useState(null);   // chosen element id
  const [price, setPrice] = useState(0);
  const [errors, setErrors] = useState([]);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);

  const canvasElRef = useRef(null);
  const fcRef = useRef(null);
  const textRefs = useRef({});   // fieldKey -> fabric.Textbox
  const symbolRef = useRef(null);
  const dataRef = useRef(null);

  // ---- load template ----
  useEffect(() => {
    getNpTemplate(slug).then((d) => {
      setData(d);
      dataRef.current = d;
      const tf = (d.template.textFields || []).filter((f) => f.status !== 'inactive');
      setFields(Object.fromEntries(tf.map((f) => [f.key, f.defaultValue || ''])));
      setFont(tf[0]?.defaultFontFamily || d.options.fonts?.[0]?.meta?.family || 'Georgia, serif');
      setColor(tf[0]?.defaultColorHex || d.options.colors?.[0]?.meta?.hex || '#c8a04d');
    }).catch(() => setError('Could not load this template.'));
  }, [slug]);

  const template = data?.template;
  const aspect = template ? (template.heightMm || 150) / (template.widthMm || 300) : 1;
  const CANVAS_H = Math.round(CANVAS_W * aspect);

  const fonts = data?.options.fonts || [];
  const colors = data?.options.colors || [];
  // "Symbols" = the admin's elements + icons, shown together in one picker.
  const symbols = useMemo(
    () => [...(data?.options.elements || []), ...(data?.options.icons || [])],
    [data]
  );

  // Load all offered fonts so the grid + canvas render them.
  useEffect(() => {
    if (!data) return;
    const fams = [...fonts.map((f) => f.meta?.family || f.name), ...(data.template.textFields || []).map((f) => f.defaultFontFamily).filter(Boolean)];
    Promise.all([...new Set(fams)].map(ensureGoogleFont)).then(() => reflow());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // ---- create the fabric canvas once ----
  useEffect(() => {
    if (!template || fcRef.current) return;
    const fc = new fabric.Canvas(canvasElRef.current, { backgroundColor: '#ffffff', selection: false });
    fcRef.current = fc;
    fc.setDimensions({ width: CANVAS_W, height: CANVAS_H });

    // Frame image (transparent PNG preferred, else base plate).
    const frameUrl = template.transparentPngUrl || template.basePlateImageUrl || template.previewImageUrl;
    if (frameUrl) {
      fabric.FabricImage.fromURL(frameUrl, { crossOrigin: 'anonymous' }).then((img) => {
        const s = Math.min(CANVAS_W / img.width, CANVAS_H / img.height);
        img.set({ scaleX: s, scaleY: s, originX: 'center', originY: 'center', left: CANVAS_W / 2, top: CANVAS_H / 2 });
        fc.backgroundImage = img;
        fc.requestRenderAll();
      }).catch(() => {});
    }

    // One locked, auto-fitting Textbox per active field.
    const d = dataRef.current;
    (d.template.textFields || []).filter((f) => f.status !== 'inactive').forEach((f) => {
      const t = new fabric.Textbox(f.defaultValue || f.placeholder || f.label, {
        left: (f.x ?? 0.5) * CANVAS_W, top: (f.y ?? 0.5) * CANVAS_H,
        width: CANVAS_W * 0.8,
        originX: 'center', originY: 'center',
        textAlign: f.align || 'center',
        fontSize: f.defaultSizePx || 40, fill: f.defaultColorHex || '#1a1a1a',
        fontFamily: f.defaultFontFamily || 'Georgia, serif',
        selectable: false, evented: false, editable: false, splitByGrapheme: false,
      });
      t.fieldKey = f.key;
      t.baseSize = f.defaultSizePx || 40;
      textRefs.current[f.key] = t;
      fc.add(t);
    });

    fc.renderAll();
    return () => { fc.dispose(); fcRef.current = null; textRefs.current = {}; symbolRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template]);

  // ---- reflect content/font/colour onto the canvas, auto-fitting text ----
  const reflow = useCallback(() => {
    const fc = fcRef.current;
    if (!fc || !dataRef.current) return;
    const tfs = dataRef.current.template.textFields || [];
    for (const [key, t] of Object.entries(textRefs.current)) {
      const f = tfs.find((x) => x.key === key);
      const val = fields[key] || f?.placeholder || '';
      const maxW = CANVAS_W * 0.82;
      t.set({ text: val, fill: color, fontFamily: font, width: maxW, fontSize: t.baseSize });
      // shrink to fit the frame width
      let guard = 0;
      while (t.width > maxW && t.fontSize > 8 && guard < 40) { t.set({ fontSize: t.fontSize - 1 }); guard++; }
      t.set({ left: (f?.x ?? 0.5) * CANVAS_W, top: (f?.y ?? 0.5) * CANVAS_H });
    }
    fc.requestRenderAll();
  }, [fields, font, color]);

  useEffect(() => { reflow(); }, [reflow]);

  // ---- symbol (element/icon) — sized + positioned by the admin template ----
  useEffect(() => {
    const fc = fcRef.current;
    if (!fc) return;
    if (symbolRef.current) { fc.remove(symbolRef.current); symbolRef.current = null; }
    const opt = symbols.find((e) => e._id === symbolId);
    const url = elImg(opt);
    if (!url) { fc.requestRenderAll(); return; }
    const t = template || {};
    // Position: admin template fields, else a legacy layout slot, else top-centre.
    const slot = (t.layout || []).find((l) => l.type === 'element' || l.type === 'icon');
    const sx = (t.symbolX ?? slot?.x ?? 0.5) * CANVAS_W;
    const sy = (t.symbolY ?? slot?.y ?? 0.16) * CANVAS_H;
    // Size: template symbolScale × the symbol's own scale multiplier (meta.scale).
    const perSymbol = Number(opt?.meta?.scale) > 0 ? Number(opt.meta.scale) : 1;
    const box = CANVAS_W * (t.symbolScale ?? 0.2) * perSymbol;
    fabric.FabricImage.fromURL(url, { crossOrigin: 'anonymous' }).then((img) => {
      // Fit the whole symbol inside the box, preserving its aspect ratio.
      const s = box / Math.max(img.width || 100, img.height || 100);
      img.set({ left: sx, top: sy, originX: 'center', originY: 'center', scaleX: s, scaleY: s, selectable: false, evented: false });
      symbolRef.current = img;
      fc.add(img);
      img.bringToFront?.();
      fc.requestRenderAll();
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolId, symbols, template]);

  // ---- live server price ----
  useEffect(() => {
    if (!template) return;
    const fontId = fonts.find((f) => (f.meta?.family || f.name) === font)?._id;
    const colorId = colors.find((c) => c.meta?.hex === color)?._id;
    const design = { fields, selections: { font: fontId, color: colorId }, elements: symbolId ? [{ id: symbolId }] : [] };
    const t = setTimeout(() => {
      quoteNpDesign(slug, design).then((qd) => { setPrice(qd.pricePaise); setErrors(qd.errors || []); }).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields, font, color, symbolId, slug, template]);

  const capturePreview = () => {
    const fc = fcRef.current;
    if (!fc) return null;
    try { fc.renderAll(); return fc.toDataURL({ format: 'png', multiplier: 1.5 }); } catch { return null; }
  };

  const handleAdd = useCallback(async () => {
    const missing = (template.textFields || []).filter((f) => f.required && !(fields[f.key] || '').trim());
    if (missing.length) { setError(`Please fill: ${missing.map((f) => f.label).join(', ')}`); return; }
    setAdding(true); setError(null);
    try {
      const dataUrl = capturePreview();
      let previewImageUrl = null;
      if (dataUrl) { try { previewImageUrl = (await uploadPreview(dataUrl)).url; } catch { previewImageUrl = null; } }
      const fontId = fonts.find((f) => (f.meta?.family || f.name) === font)?._id;
      const colorId = colors.find((c) => c.meta?.hex === color)?._id;
      const design = { fields, selections: { font: fontId, color: colorId, fontFamily: font, colorHex: color }, elements: symbolId ? [{ id: symbolId }] : [] };
      const payload = { templateSlug: slug, design, canvas: {}, previewImageUrl, quantity: 1 };
      if (isAuthed) { await dispatch(addNameplateToCart(payload)).unwrap(); navigate('/cart'); }
      else { localStorage.setItem(PENDING_NAMEPLATE_KEY, JSON.stringify(payload)); navigate('/login', { state: { from: { pathname: `/nameplates/${slug}` } } }); }
    } catch (err) { setError(apiErrorMessage(err, 'Could not add to cart')); }
    finally { setAdding(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, fields, font, color, symbolId, slug, isAuthed]);

  const activeFields = useMemo(() => (template?.textFields || []).filter((f) => f.status !== 'inactive'), [template]);

  if (error && !data) return <div className="mx-auto max-w-md px-4 py-20 text-center text-gray-500">{error}</div>;
  if (!data) return <div className="mx-auto max-w-md px-4 py-20 text-center text-gray-400">Loading designer…</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Seo title={`Design · ${template.name}`} description={`Customize the ${template.name} name plate.`} path={`/nameplates/${slug}`} />
      <h1 className="font-display text-2xl font-medium">{template.name}</h1>
      <p className="text-sm text-gray-500">Type your details, pick a font, colour and symbol — the design fits the frame automatically.</p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Frame preview */}
        <div>
          <div className="flex justify-center rounded-2xl border border-gray-200 bg-white p-3">
            <canvas ref={canvasElRef} className="rounded-lg" />
          </div>
          <p className="mt-2 text-center text-xs text-gray-400">Live preview — the print file is regenerated at high resolution server-side.</p>
        </div>

        {/* Controls */}
        <div className="max-h-[76vh] space-y-5 overflow-y-auto pr-1">
          {/* Text fields */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Your details</h3>
            <div className="mt-3 space-y-3">
              {activeFields.map((f) => (
                <div key={f.key}>
                  <label className="flex items-center justify-between text-sm font-medium text-gray-700">
                    <span>{f.label}{f.required && <span className="ml-1 text-indigo-500">*</span>}</span>
                    <span className="text-xs text-gray-400">{(fields[f.key] || '').length}/{f.maxLength}</span>
                  </label>
                  <input value={fields[f.key] || ''} maxLength={f.maxLength} placeholder={f.placeholder}
                    onChange={(e) => setFields((s) => ({ ...s, [f.key]: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
              ))}
            </div>
          </div>

          {/* Choose Font */}
          {fonts.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Choose font</h3>
              <div className="mt-3 grid max-h-64 grid-cols-3 gap-2 overflow-y-auto pr-1">
                {fonts.map((fo) => {
                  const fam = fo.meta?.family || fo.name;
                  const on = font === fam;
                  return (
                    <button key={fo._id} onClick={() => setFont(fam)} title={fo.name}
                      className={`rounded-lg border py-3 text-center text-xl transition ${on ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
                      style={{ fontFamily: fam }}>Abc</button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Choose Colour */}
          {colors.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Choose colour</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {colors.map((c) => c.meta?.hex && (
                  <button key={c._id} title={c.name} onClick={() => setColor(c.meta.hex)}
                    className={`h-9 w-9 rounded-full border-2 transition ${color === c.meta.hex ? 'scale-110 border-indigo-600' : 'border-black/10 hover:scale-105'}`}
                    style={{ background: c.meta.hex }} />
                ))}
              </div>
            </div>
          )}

          {/* Choose Symbol (elements + icons) */}
          {symbols.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Choose symbol</h3>
              <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
                <button onClick={() => setSymbolId(null)} className={`flex h-14 items-center justify-center rounded-lg border text-xs ${!symbolId ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-gray-200 text-gray-400'}`}>None</button>
                {symbols.map((el) => (
                  <button key={el._id} onClick={() => setSymbolId(el._id)} title={el.name}
                    className={`flex h-14 items-center justify-center rounded-lg border p-1.5 transition ${symbolId === el._id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}>
                    {elImg(el) ? <img src={elImg(el)} alt={el.name} className="max-h-full max-w-full object-contain" /> : <span className="truncate text-[10px] text-gray-400">{el.name}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price + buy */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-baseline justify-between">
              <span className="text-xs uppercase tracking-wide text-gray-400">Total</span>
              <span className="font-display text-2xl font-bold">{formatPaise(price)}</span>
            </div>
            <p className="mt-1 text-xs text-gray-400">Final price confirmed at checkout.</p>
            {errors.length > 0 && <div className="mt-2 text-xs text-amber-600">{errors[0]}</div>}
            {error && <div className="mt-2 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <button onClick={handleAdd} disabled={adding} className="mt-4 w-full rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
              {adding ? 'Adding…' : 'Add to cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
