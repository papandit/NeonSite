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
  bgSlot,            // { x, y, width, height } normalized — background-style plates
  onBgSlotChange,
  bgPreviewUrl,      // sample artwork shown inside the slot
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
      backgroundColor: '#eff6f5',
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
      } else if (o.ncType === 'bgslot') {
        cbRef.current.onBgSlotChange?.({
          x: +(o.left / W).toFixed(4),
          y: +(o.top / H).toFixed(4),
          width: +(((o.width || 100) * (o.scaleX || 1)) / W).toFixed(4),
          height: +(((o.height || 100) * (o.scaleY || 1)) / H).toFixed(4),
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
        borderColor: '#00af99',
        cornerColor: '#00af99',
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
      if (!o) return;
      ensureGoogleFont(f.defaultFontFamily);
      // Appearance (colour / font / align) always updates live — even on the
      // selected line — so form changes show immediately in the preview.
      o.set({
        fill: f.defaultColorHex || '#1a1a1a',
        fontFamily: f.defaultFontFamily || 'Georgia, serif',
        textAlign: f.align || 'center',
      });
      // Text updates unless the admin is typing directly into this line.
      if (!o.isEditing) o.set({ text: f.defaultValue || f.label || f.key });
      // Position / size / rotation must NOT fight an in-progress drag/resize.
      if (o !== fc.getActiveObject()) {
        o.set({ left: (f.x ?? 0.5) * W, top: (f.y ?? 0.5) * H, fontSize: f.defaultSizePx || 40, angle: f.rotation || 0, scaleX: 1, scaleY: 1 });
        o.setCoords();
      }
    });
    fc.requestRenderAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields]);

  // ---- background region (background-style plates): drag + resize freely ----
  const bgRef = useRef(null);
  useEffect(() => {
    const fc = fcRef.current;
    if (!fc) return;
    if (bgRef.current) { fc.remove(bgRef.current); bgRef.current = null; }
    if (!bgSlot) { fc.requestRenderAll(); return; }
    const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);
    const bw = Math.max(0.02, num(bgSlot.width, 0.8)) * W;
    const bh = Math.max(0.02, num(bgSlot.height, 0.8)) * H;
    const bx = num(bgSlot.x, 0.5) * W;
    const by = num(bgSlot.y, 0.5) * H;

    const style = {
      left: bx, top: by, originX: 'center', originY: 'center',
      borderColor: '#ffb003', cornerColor: '#ffb003', cornerStyle: 'circle',
      cornerSize: 10, transparentCorners: false,
    };
    const place = (obj) => {
      obj.set(style);
      obj.ncType = 'bgslot';
      bgRef.current = obj;
      fc.add(obj);
      fc.sendObjectToBack?.(obj); // stay behind the text + symbol
      fc.requestRenderAll();
    };

    if (bgPreviewUrl) {
      fabric.FabricImage.fromURL(bgPreviewUrl, { crossOrigin: 'anonymous' })
        .then((img) => {
          // Cover-fill the region, then clip to it — exactly how the storefront draws it.
          const s = Math.max(bw / (img.width || 1), bh / (img.height || 1));
          img.set({ scaleX: s, scaleY: s });
          img.clipPath = new fabric.Rect({ width: bw / s, height: bh / s, originX: 'center', originY: 'center' });
          place(img);
        })
        .catch(() => place(new fabric.Rect({ width: bw, height: bh, fill: 'rgba(255,176,3,0.12)', stroke: '#ffb003', strokeDashArray: [6, 4], strokeWidth: 2 })));
    } else {
      place(new fabric.Rect({ width: bw, height: bh, fill: 'rgba(255,176,3,0.12)', stroke: '#ffb003', strokeDashArray: [6, 4], strokeWidth: 2 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgSlot?.x, bgSlot?.y, bgSlot?.width, bgSlot?.height, bgPreviewUrl, H]);

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
        borderColor: '#00af99',
        cornerColor: '#00af99',
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

    // A plain dashed square marking where + how big the customer's chosen symbol
    // will sit. The symbol itself is picked on the storefront.
    place(new fabric.Rect({
      left: 0, top: 0, width: 100, height: 100, rx: 10, ry: 10,
      fill: 'rgba(79,70,229,0.08)', stroke: '#00af99', strokeDashArray: [6, 4], strokeWidth: 2,
    }), 100);
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
