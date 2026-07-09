// Name Plate Designer — a Canva-style editor driven ENTIRELY by the admin's
// template. It renders the base plate + only the text fields the admin defined,
// lets the customer fill them in and (per-field capabilities) restyle/move them,
// add allowed decorative elements, see a live server-priced total, and buy —
// through the normal cart -> checkout -> order flow.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import * as fabric from 'fabric';
import { getNpTemplate, quoteNpDesign } from '../services/nameplate';
import { uploadPreview } from '../services/pricing';
import { addNameplateToCart } from '../store/cartSlice';
import { selectIsAuthenticated } from '../store/authSlice';
import { formatPaise } from '../utils/money';
import { apiErrorMessage } from '../services/api';
import Seo from '../components/Seo';

export const PENDING_NAMEPLATE_KEY = 'nc_pending_nameplate';
const CANVAS_W = 560;

export default function NamePlateDesignerPage() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthed = useSelector(selectIsAuthenticated);

  const [data, setData] = useState(null);         // { template, options }
  const [fields, setFields] = useState({});        // { fieldKey: value }
  const [styles, setStyles] = useState({});        // { fieldKey: {font,color,size,bold,italic,x,y} }
  const [selections, setSelections] = useState({}); // { font,color,material,size,background }
  const [placed, setPlaced] = useState([]);        // added elements [{id,name,url}]
  const [activeKey, setActiveKey] = useState(null);
  const [price, setPrice] = useState(0);
  const [errors, setErrors] = useState([]);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);

  const canvasElRef = useRef(null);
  const fcRef = useRef(null);
  const textRefs = useRef({});   // fieldKey -> fabric.IText
  const dataRef = useRef(null);

  // ---- load template ----
  useEffect(() => {
    getNpTemplate(slug).then((d) => {
      setData(d);
      dataRef.current = d;
      const tf = (d.template.textFields || []).filter((f) => f.status !== 'inactive');
      setFields(Object.fromEntries(tf.map((f) => [f.key, f.defaultValue || ''])));
      setStyles(Object.fromEntries(tf.map((f) => [f.key, {
        font: f.defaultFontFamily || d.options.fonts?.[0]?.meta?.family || 'Georgia, serif',
        color: f.defaultColorHex || '#1a1a1a', size: f.defaultSizePx || 40,
        bold: false, italic: false, x: f.x ?? 0.5, y: f.y ?? 0.5,
      }])));
    }).catch(() => setError('Could not load this template.'));
  }, [slug]);

  const template = data?.template;
  const aspect = template ? (template.heightMm || 150) / (template.widthMm || 300) : 0.5;
  const CANVAS_H = Math.round(CANVAS_W * aspect);

  // ---- create fabric canvas once template known ----
  useEffect(() => {
    if (!template || fcRef.current) return;
    const fc = new fabric.Canvas(canvasElRef.current, { backgroundColor: '#f5efe6', preserveObjectStacking: true });
    fcRef.current = fc;
    fc.setDimensions({ width: CANVAS_W, height: CANVAS_H });

    // base plate as background
    if (template.basePlateImageUrl) {
      fabric.FabricImage.fromURL(template.basePlateImageUrl, { crossOrigin: 'anonymous' })
        .then((img) => {
          const s = Math.max(CANVAS_W / img.width, CANVAS_H / img.height);
          img.set({ scaleX: s, scaleY: s, originX: 'center', originY: 'center', left: CANVAS_W / 2, top: CANVAS_H / 2 });
          fc.backgroundImage = img;
          fc.requestRenderAll();
        }).catch(() => {});
    }

    // one IText per active text field
    const d = dataRef.current;
    (d.template.textFields || []).filter((f) => f.status !== 'inactive').forEach((f) => {
      const st = { size: f.defaultSizePx || 40, color: f.defaultColorHex || '#1a1a1a', font: f.defaultFontFamily || 'Georgia, serif' };
      const t = new fabric.IText(f.defaultValue || f.placeholder || f.label, {
        left: (f.x ?? 0.5) * CANVAS_W, top: (f.y ?? 0.5) * CANVAS_H,
        originX: f.align === 'left' ? 'left' : f.align === 'right' ? 'right' : 'center', originY: 'center',
        fontSize: st.size, fill: st.color, fontFamily: st.font, angle: f.rotation || 0,
        editable: false, hasControls: Boolean(f.canResize || f.canRotate),
        lockMovementX: !f.canMove, lockMovementY: !f.canMove, lockRotation: !f.canRotate,
        lockScalingX: !f.canResize, lockScalingY: !f.canResize,
      });
      t.fieldKey = f.key;
      textRefs.current[f.key] = t;
      fc.add(t);
    });

    fc.on('selection:created', (e) => setActiveKey(e.selected?.[0]?.fieldKey || null));
    fc.on('selection:updated', (e) => setActiveKey(e.selected?.[0]?.fieldKey || null));
    fc.on('selection:cleared', () => setActiveKey(null));
    fc.on('object:modified', (e) => {
      const o = e.target;
      if (!o?.fieldKey) return;
      setStyles((s) => ({ ...s, [o.fieldKey]: { ...s[o.fieldKey], x: o.left / CANVAS_W, y: o.top / CANVAS_H, size: Math.round(o.fontSize * (o.scaleY || 1)) } }));
      o.set({ fontSize: Math.round(o.fontSize * (o.scaleY || 1)), scaleX: 1, scaleY: 1 });
    });

    fc.renderAll();
    return () => { fc.dispose(); fcRef.current = null; textRefs.current = {}; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template]);

  // ---- reflect field values + styles onto the canvas ----
  useEffect(() => {
    const fc = fcRef.current;
    if (!fc) return;
    for (const [key, t] of Object.entries(textRefs.current)) {
      const st = styles[key] || {};
      const val = fields[key];
      t.set({
        text: val || (data.template.textFields.find((f) => f.key === key)?.placeholder) || key,
        fill: st.color, fontFamily: st.font, fontSize: st.size,
        fontWeight: st.bold ? 'bold' : 'normal', fontStyle: st.italic ? 'italic' : 'normal',
      });
    }
    fc.requestRenderAll();
  }, [fields, styles, data]);

  // ---- live server price (debounced) ----
  useEffect(() => {
    if (!template) return;
    const design = { fields, selections, elements: placed.map((p) => ({ id: p.id })) };
    const t = setTimeout(() => {
      quoteNpDesign(slug, design).then((q) => { setPrice(q.pricePaise); setErrors(q.errors || []); }).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [fields, selections, placed, slug, template]);

  const setStyle = (key, patch) => setStyles((s) => ({ ...s, [key]: { ...s[key], ...patch } }));

  const addElement = (opt) => {
    const fc = fcRef.current;
    const url = opt.meta?.image || opt.imageUrl || opt.meta?.svg || opt.svg;
    if (!fc || !url) return;
    fabric.FabricImage.fromURL(url, { crossOrigin: 'anonymous' }).then((img) => {
      const s = (CANVAS_W * 0.18) / (img.width || 100);
      img.set({ left: CANVAS_W / 2, top: CANVAS_H / 2, originX: 'center', originY: 'center', scaleX: s, scaleY: s });
      fc.add(img);
      fc.setActiveObject(img);
      fc.requestRenderAll();
    }).catch(() => {});
    setPlaced((p) => [...p, { id: opt._id, name: opt.name }]);
  };

  const capturePreview = () => {
    const fc = fcRef.current;
    if (!fc) return null;
    try { fc.discardActiveObject(); fc.renderAll(); return fc.toDataURL({ format: 'png', multiplier: 1 }); }
    catch { return null; }
  };

  const handleAdd = useCallback(async () => {
    // Required field check (mirrors server).
    const missing = (template.textFields || []).filter((f) => f.required && !(fields[f.key] || '').trim());
    if (missing.length) { setError(`Please fill: ${missing.map((f) => f.label).join(', ')}`); return; }
    setAdding(true); setError(null);
    try {
      const dataUrl = capturePreview();
      let previewImageUrl = null;
      if (dataUrl) { try { previewImageUrl = (await uploadPreview(dataUrl)).url; } catch { previewImageUrl = null; } }
      const design = { fields, selections, elements: placed.map((p) => ({ id: p.id })) };
      const payload = { templateSlug: slug, design, canvas: {}, previewImageUrl, quantity: 1 };
      if (isAuthed) {
        await dispatch(addNameplateToCart(payload)).unwrap();
        navigate('/cart');
      } else {
        localStorage.setItem(PENDING_NAMEPLATE_KEY, JSON.stringify(payload));
        navigate('/login', { state: { from: { pathname: `/nameplates/${slug}` } } });
      }
    } catch (err) { setError(apiErrorMessage(err, 'Could not add to cart')); }
    finally { setAdding(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, fields, selections, placed, slug, isAuthed]);

  if (error && !data) return <div className="mx-auto max-w-md px-4 py-20 text-center text-gray-500">{error}</div>;
  if (!data) return <div className="mx-auto max-w-md px-4 py-20 text-center text-gray-400">Loading designer…</div>;

  const activeField = template.textFields.find((f) => f.key === activeKey);
  const activeStyle = activeKey ? styles[activeKey] : null;
  const fonts = data.options.fonts || [];
  const colors = data.options.colors || [];
  const elements = data.options.elements || [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Seo title={`Design · ${template.name}`} description={`Customize the ${template.name} name plate.`} path={`/nameplates/${slug}`} />
      <h1 className="font-display text-2xl font-medium">{template.name}</h1>
      <p className="text-sm text-gray-500">Fill in your details — the preview updates live.</p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Canvas */}
        <div>
          <div className="flex justify-center rounded-2xl border border-gray-200 bg-white p-3">
            <canvas ref={canvasElRef} className="rounded-lg" />
          </div>
          <p className="mt-2 text-center text-xs text-gray-400">Click a text on the plate to move, resize or restyle it. The final print file is regenerated server-side.</p>
        </div>

        {/* Controls */}
        <div className="space-y-5">
          {/* Dynamic fields */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Your details</h3>
            <div className="mt-3 space-y-3">
              {template.textFields.filter((f) => f.status !== 'inactive').map((f) => (
                <div key={f.key}>
                  <label className="flex items-center justify-between text-sm font-medium text-gray-700">
                    <span>{f.label}{f.required && <span className="ml-1 text-indigo-500">*</span>}</span>
                    <span className="text-xs text-gray-400">{(fields[f.key] || '').length}/{f.maxLength}</span>
                  </label>
                  <input
                    value={fields[f.key] || ''} maxLength={f.maxLength} placeholder={f.placeholder}
                    onChange={(e) => setFields((s) => ({ ...s, [f.key]: e.target.value }))}
                    onFocus={() => { const t = textRefs.current[f.key]; if (t) { fcRef.current.setActiveObject(t); fcRef.current.requestRenderAll(); } }}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Selected field styling */}
          {activeField && activeStyle && (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Style: {activeField.label}</h3>
              <div className="mt-3 space-y-3">
                {activeField.canChangeFont && fonts.length > 0 && (
                  <select value={activeStyle.font} onChange={(e) => setStyle(activeKey, { font: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                    {fonts.map((fo) => <option key={fo._id} value={fo.meta?.family || fo.name}>{fo.name}</option>)}
                  </select>
                )}
                <div className="flex items-center gap-3">
                  {activeField.canChangeColor && (
                    <label className="flex items-center gap-1.5 text-sm text-gray-600">Colour
                      <input type="color" value={activeStyle.color} onChange={(e) => setStyle(activeKey, { color: e.target.value })} className="h-8 w-10 rounded border border-gray-300" />
                    </label>
                  )}
                  {activeField.canChangeSize && (
                    <label className="flex flex-1 items-center gap-2 text-sm text-gray-600">Size
                      <input type="range" min="12" max="120" value={activeStyle.size} onChange={(e) => setStyle(activeKey, { size: Number(e.target.value) })} className="flex-1" />
                    </label>
                  )}
                </div>
                <div className="flex gap-2">
                  {activeField.canBold && <button onClick={() => setStyle(activeKey, { bold: !activeStyle.bold })} className={`rounded-md border px-3 py-1.5 text-sm font-bold ${activeStyle.bold ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300'}`}>B</button>}
                  {activeField.canItalic && <button onClick={() => setStyle(activeKey, { italic: !activeStyle.italic })} className={`rounded-md border px-3 py-1.5 text-sm italic ${activeStyle.italic ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300'}`}>I</button>}
                </div>
                {colors.length > 0 && activeField.canChangeColor && (
                  <div className="flex flex-wrap gap-1.5">
                    {colors.map((c) => c.meta?.hex && (
                      <button key={c._id} title={c.name} onClick={() => { setStyle(activeKey, { color: c.meta.hex }); setSelections((s) => ({ ...s, color: c._id })); }} className="h-6 w-6 rounded-full border border-black/10" style={{ background: c.meta.hex }} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Elements */}
          {elements.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Add elements</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {elements.map((el) => (
                  <button key={el._id} onClick={() => addElement(el)} title={el.name} className="flex h-14 w-14 items-center justify-center rounded-lg border border-gray-200 bg-white hover:border-indigo-300">
                    {(el.meta?.image || el.imageUrl || el.meta?.svg) ? <img src={el.meta?.image || el.imageUrl || el.meta?.svg} alt={el.name} className="max-h-10 max-w-10 object-contain" /> : <span className="text-xs text-gray-400">{el.name}</span>}
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
