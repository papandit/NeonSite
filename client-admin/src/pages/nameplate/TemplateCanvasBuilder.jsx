// Canva-style visual builder for a Name Plate template. The admin drags text
// fields and the symbol slot onto the base plate, resizes them (corner handles
// = font size / symbol size) and rotates them. Every change writes normalized
// coordinates (0..1), font size in px and rotation back to the template — the
// storefront designer renders the EXACT same layout at the same canvas width.

import { useEffect, useRef } from 'react';
import * as fabric from 'fabric';
import { ensureGoogleFont } from '../../lib/loadFont';

const W = 560; // must match the storefront designer's CANVAS_W

export default function TemplateCanvasBuilder({
  baseImageUrl,
  aspect = 0.5,
  fields = [],
  onFieldChange,
  symbol,
  onSymbolChange,
}) {
  const elRef = useRef(null);
  const fcRef = useRef(null);
  const objsRef = useRef({}); // fieldIndex -> IText
  const symRef = useRef(null); // symbol object
  const H = Math.round(W * (aspect || 0.5));

  // Latest callbacks, read inside stable fabric handlers.
  const cbRef = useRef({});
  cbRef.current = { onFieldChange, onSymbolChange };

  const shown = fields
    .map((f, i) => ({ f, i }))
    .filter(({ f }) => f.status !== 'inactive' && f.key);

  // ---- create the canvas once (per size) ----
  useEffect(() => {
    const fc = new fabric.Canvas(elRef.current, {
      selection: false,
      preserveObjectStacking: true,
      backgroundColor: '#eef2f7',
      uniformScaling: true, // corner scaling stays proportional (font scales cleanly)
    });
    fcRef.current = fc;
    fc.setDimensions({ width: W, height: H });

    fc.on('object:modified', (e) => {
      const o = e.target;
      if (!o) return;
      if (o.ncType === 'text') {
        const size = Math.max(6, Math.round((o.fontSize || 40) * (o.scaleY || 1)));
        o.set({ fontSize: size, scaleX: 1, scaleY: 1 });
        cbRef.current.onFieldChange?.(o.ncIndex, {
          x: +(o.left / W).toFixed(4),
          y: +(o.top / H).toFixed(4),
          defaultSizePx: size,
          rotation: Math.round(o.angle || 0),
        });
      } else if (o.ncType === 'symbol') {
        const scale = +(((o.width || 100) * (o.scaleX || 1)) / W).toFixed(4);
        cbRef.current.onSymbolChange?.({
          x: +(o.left / W).toFixed(4),
          y: +(o.top / H).toFixed(4),
          scale: Math.min(0.9, Math.max(0.03, scale)),
        });
      }
      fc.requestRenderAll();
    });

    // Double-click a text line to edit it right on the plate; the typed text is
    // saved as that field's default value.
    fc.on('text:editing:exited', (e) => {
      const o = e.target;
      if (o?.ncType === 'text') cbRef.current.onFieldChange?.(o.ncIndex, { defaultValue: o.text });
    });

    return () => { fc.dispose(); fcRef.current = null; objsRef.current = {}; symRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [H]);

  // ---- base plate background ----
  useEffect(() => {
    const fc = fcRef.current;
    if (!fc) return;
    if (!baseImageUrl) { fc.backgroundImage = null; fc.requestRenderAll(); return; }
    fabric.FabricImage.fromURL(baseImageUrl, { crossOrigin: 'anonymous' })
      .then((img) => {
        const s = Math.min(W / img.width, H / img.height);
        img.set({ scaleX: s, scaleY: s, originX: 'center', originY: 'center', left: W / 2, top: H / 2 });
        fc.backgroundImage = img;
        fc.requestRenderAll();
      })
      .catch(() => {});
  }, [baseImageUrl, H]);

  // ---- reconcile text objects when the SET of fields changes (add/remove/rekey) ----
  const sig = shown.map(({ f, i }) => `${i}:${f.key}`).join('|');
  useEffect(() => {
    const fc = fcRef.current;
    if (!fc) return;
    Object.values(objsRef.current).forEach((o) => fc.remove(o));
    objsRef.current = {};
    shown.forEach(({ f, i }) => {
      ensureGoogleFont(f.defaultFontFamily);
      const t = new fabric.IText(f.defaultValue || f.label || f.key, {
        left: (f.x ?? 0.5) * W,
        top: (f.y ?? 0.5) * H,
        originX: 'center',
        originY: 'center',
        fontSize: f.defaultSizePx || 40,
        fill: f.defaultColorHex || '#1a1a1a',
        fontFamily: f.defaultFontFamily || 'Georgia, serif',
        textAlign: f.align || 'center',
        angle: f.rotation || 0,
        editable: true, // double-click to edit the text on the plate
        borderColor: '#4f46e5',
        cornerColor: '#4f46e5',
        cornerStyle: 'circle',
        cornerSize: 10,
        transparentCorners: false,
        padding: 4,
      });
      t.ncType = 'text';
      t.ncIndex = i;
      t.setControlsVisibility({ ml: false, mr: false, mt: false, mb: false }); // corners + rotate only
      objsRef.current[i] = t;
      fc.add(t);
    });
    fc.requestRenderAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, H]);

  // ---- live-sync every field prop onto the canvas (two-way with the form) ----
  // Safe against feedback loops: field state only changes on 'object:modified'
  // (drag/resize end), so re-applying the same value here is a no-op.
  useEffect(() => {
    const fc = fcRef.current;
    if (!fc) return;
    shown.forEach(({ f, i }) => {
      const o = objsRef.current[i];
      if (!o || o === fc.getActiveObject()) return; // don't fight an in-progress edit
      ensureGoogleFont(f.defaultFontFamily);
      o.set({
        text: f.defaultValue || f.label || f.key,
        fill: f.defaultColorHex || '#1a1a1a',
        fontFamily: f.defaultFontFamily || 'Georgia, serif',
        textAlign: f.align || 'center',
        left: (f.x ?? 0.5) * W,
        top: (f.y ?? 0.5) * H,
        fontSize: f.defaultSizePx || 40,
        angle: f.rotation || 0,
        scaleX: 1,
        scaleY: 1,
      });
      o.setCoords();
    });
    fc.requestRenderAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields]);

  // ---- symbol slot (draggable + resizable) ----
  useEffect(() => {
    const fc = fcRef.current;
    if (!fc) return;
    if (symRef.current) { fc.remove(symRef.current); symRef.current = null; }
    if (!symbol) { fc.requestRenderAll(); return; }
    // Sanitize (older templates may have NaN/undefined values).
    const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);
    const sScale = num(symbol.scale, 0.2), sX = num(symbol.x, 0.5), sY = num(symbol.y, 0.2);
    const box = sScale * W;

    const place = (obj, baseW) => {
      const s = box / (baseW || 100);
      // Clamp the centre so the symbol is never cut off by the canvas edges.
      const halfW = ((obj.width || 100) * s) / 2;
      const halfH = ((obj.height || 100) * s) / 2;
      const m = 4;
      const cx = Math.min(Math.max(sX * W, halfW + m), W - halfW - m);
      const cy = Math.min(Math.max(sY * H, halfH + m), H - halfH - m);
      obj.set({
        left: cx,
        top: cy,
        originX: 'center',
        originY: 'center',
        scaleX: s,
        scaleY: s,
        borderColor: '#4f46e5',
        cornerColor: '#4f46e5',
        cornerStyle: 'circle',
        cornerSize: 10,
        transparentCorners: false,
      });
      obj.ncType = 'symbol';
      obj.setControlsVisibility({ ml: false, mr: false, mt: false, mb: false });
      symRef.current = obj;
      fc.add(obj);
      fc.requestRenderAll();
    };

    // A clean, always-centred slot marker (never cut) showing where + how big the
    // customer's chosen symbol will sit. The actual symbol is picked on the
    // storefront; here we only set its box.
    const rect = new fabric.Rect({ left: 0, top: 0, width: 100, height: 100, rx: 14, ry: 14, fill: 'rgba(79,70,229,0.12)', stroke: '#4f46e5', strokeDashArray: [6, 4], strokeWidth: 2 });
    const star = new fabric.Text('✦', { left: 50, top: 50, originX: 'center', originY: 'center', fontSize: 44, fill: '#4f46e5' });
    place(new fabric.Group([rect, star]), 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol?.x, symbol?.y, symbol?.scale, H]);

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="mx-auto w-fit rounded-xl border border-slate-300 bg-slate-100 p-2 shadow-inner">
          <canvas ref={elRef} className="rounded-lg" />
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-slate-400">
        Drag to move · corner handles to resize · top handle to rotate · <span className="font-medium text-slate-500">double-click text to edit</span>. The storefront renders this exact layout.
        {!baseImageUrl && ' Upload a base plate image above for a realistic backdrop.'}
      </p>
    </div>
  );
}
