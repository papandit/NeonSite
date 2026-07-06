// Live preview canvas (Fabric.js v7). If the product has an admin-uploaded photo
// it becomes the plate background (cover-fit) and the customer's text/icons are
// laid over it; otherwise we fall back to the selected background colour. Text/
// icons are draggable; drops update the normalized layout. This is the PREVIEW
// only — the manufacturing render is regenerated server-side.

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as fabric from 'fabric';
import { moveElement, selectDesignDocument } from '../store/designSlice';
import { aspectRatio } from './layout';

const CANVAS_W = 520;

const FabricCanvas = forwardRef(function FabricCanvas({ photoUrl }, ref) {
  const dispatch = useDispatch();
  const design = useSelector(selectDesignDocument);
  const elRef = useRef(null);
  const fcRef = useRef(null);
  const photoRef = useRef(null); // loaded fabric.Image for the product photo
  const photoTaintedRef = useRef(false); // true if the photo can't be exported (CORS)

  // Expose an imperative preview generator to the parent. Guarded so a tainted
  // (cross-origin) canvas never blocks add-to-cart — it just returns null.
  useImperativeHandle(ref, () => ({
    toDataURL() {
      const fc = fcRef.current;
      if (!fc || photoTaintedRef.current) return null;
      try {
        fc.discardActiveObject();
        fc.renderAll();
        return fc.toDataURL({ format: 'png', multiplier: 1 });
      } catch {
        return null; // canvas tainted by a cross-origin image
      }
    },
  }));

  // Create the fabric canvas once.
  useEffect(() => {
    const fc = new fabric.Canvas(elRef.current, {
      backgroundColor: '#f5efe6',
      preserveObjectStacking: true,
      selection: false,
    });
    fcRef.current = fc;

    fc.on('object:modified', (e) => {
      const obj = e.target;
      if (!obj || obj.elementIndex == null) return;
      const c = obj.getCenterPoint();
      dispatch(
        moveElement({
          index: obj.elementIndex,
          x: Math.min(1, Math.max(0, c.x / fc.getWidth())),
          y: Math.min(1, Math.max(0, c.y / fc.getHeight())),
        })
      );
    });

    return () => {
      fc.dispose();
      fcRef.current = null;
    };
  }, [dispatch]);

  // Load the admin-uploaded product photo whenever it changes.
  useEffect(() => {
    let cancelled = false;
    photoRef.current = null;
    photoTaintedRef.current = false;
    if (!photoUrl) {
      fcRef.current?.requestRenderAll();
      return;
    }
    fabric.FabricImage.fromURL(photoUrl, { crossOrigin: 'anonymous' })
      .then((img) => {
        if (cancelled) return;
        photoRef.current = img;
        redraw();
      })
      .catch(() => {
        // If it can't load cross-origin, retry without CORS so it still SHOWS
        // (but mark it tainted so we don't try to export the canvas).
        fabric.FabricImage.fromURL(photoUrl)
          .then((img) => {
            if (cancelled) return;
            photoRef.current = img;
            photoTaintedRef.current = true;
            redraw();
          })
          .catch(() => {});
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoUrl]);

  // Cover-fit the loaded photo into the current canvas size, centred.
  function applyPhotoBackground(fc, W, H) {
    const img = photoRef.current;
    if (!img) {
      fc.backgroundImage = null;
      return false;
    }
    const scale = Math.max(W / img.width, H / img.height);
    img.set({
      scaleX: scale,
      scaleY: scale,
      originX: 'center',
      originY: 'center',
      left: W / 2,
      top: H / 2,
    });
    fc.backgroundImage = img;
    return true;
  }

  // Redraw everything from the current design + photo.
  function redraw() {
    const fc = fcRef.current;
    if (!fc) return;

    const ratio = aspectRatio(design.layout?.canvas?.aspect);
    const W = CANVAS_W;
    const H = Math.round(W / ratio);
    fc.setDimensions({ width: W, height: H });

    const hasPhoto = applyPhotoBackground(fc, W, H);

    // Background colour only when there is no product photo behind the text.
    if (!hasPhoto) {
      const bg = design.selections.background?.snapshot?.meta;
      fc.backgroundColor = bg?.type === 'color' && bg?.value ? bg.value : '#f5efe6';
    } else {
      fc.backgroundColor = 'transparent';
    }

    fc.remove(...fc.getObjects());

    // Border
    const border = design.selections.border?.snapshot;
    if (border?.name && border.name.toLowerCase() !== 'none') {
      const inset = Math.round(Math.min(W, H) * 0.04);
      const rect = new fabric.Rect({
        left: inset,
        top: inset,
        width: W - inset * 2,
        height: H - inset * 2,
        fill: 'transparent',
        stroke: /luxury|gold/i.test(border.name) ? '#C8A04D' : '#3a2f27',
        strokeWidth: Math.max(1, Math.round(Math.min(W, H) * 0.012)),
        selectable: false,
        evented: false,
      });
      fc.add(rect);
    }

    const textColor = design.selections.color?.snapshot?.meta?.hex || '#1a1a1a';
    const family = design.selections.font?.snapshot?.meta?.family || 'Georgia, serif';
    const textByField = Object.fromEntries(design.text.map((t) => [t.field, t.value]));

    (design.layout?.elements || []).forEach((el, index) => {
      if (el.type === 'text') {
        const value = textByField[el.ref];
        if (!value) return;
        const t = new fabric.IText(value, {
          left: el.x * W,
          top: el.y * H,
          originX: el.align === 'left' ? 'left' : el.align === 'right' ? 'right' : 'center',
          originY: 'center',
          fontSize: Math.round(H * 0.14 * (el.scale || 1)),
          fill: textColor,
          fontFamily: family,
          editable: false,
          hasControls: false,
          // Legible over a photo: soft shadow so text reads on any background.
          shadow: hasPhoto ? new fabric.Shadow({ color: 'rgba(0,0,0,0.55)', blur: 6, offsetX: 0, offsetY: 1 }) : null,
        });
        t.elementIndex = index;
        fc.add(t);
      } else if (el.type === 'icon') {
        const icon = design.icons[el.ref];
        if (!icon) return;
        const size = Math.round(H * 0.18 * (el.scale || 1));
        const circle = new fabric.Circle({
          radius: size / 2,
          fill: 'transparent',
          stroke: textColor,
          strokeWidth: Math.max(1, size * 0.04),
          originX: 'center',
          originY: 'center',
        });
        const letter = new fabric.FabricText((icon.snapshot?.name || '?').charAt(0), {
          fontSize: size * 0.5,
          fill: textColor,
          fontFamily: family,
          originX: 'center',
          originY: 'center',
        });
        const group = new fabric.Group([circle, letter], {
          left: el.x * W,
          top: el.y * H,
          originX: 'center',
          originY: 'center',
          hasControls: false,
          shadow: hasPhoto ? new fabric.Shadow({ color: 'rgba(0,0,0,0.5)', blur: 6, offsetX: 0, offsetY: 1 }) : null,
        });
        group.elementIndex = index;
        fc.add(group);
      }
    });

    fc.renderAll();
  }

  // Redraw whenever the design changes.
  useEffect(() => {
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design]);

  return (
    <div className="flex justify-center">
      <canvas ref={elRef} className="rounded-lg border border-gray-200 shadow-sm" />
    </div>
  );
});

export default FabricCanvas;
