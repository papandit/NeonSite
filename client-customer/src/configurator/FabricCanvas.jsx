// Live preview canvas (Fabric.js v7). Renders text + icons + background + border
// from the design. Text/icons are draggable; drops update the normalized layout.
// This is the PREVIEW only — the manufacturing render is regenerated server-side.

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as fabric from 'fabric';
import { moveElement, selectDesignDocument } from '../store/designSlice';
import { aspectRatio } from './layout';

const CANVAS_W = 520;

const FabricCanvas = forwardRef(function FabricCanvas(_props, ref) {
  const dispatch = useDispatch();
  const design = useSelector(selectDesignDocument);
  const elRef = useRef(null);
  const fcRef = useRef(null);

  // Expose an imperative preview generator to the parent.
  useImperativeHandle(ref, () => ({
    toDataURL() {
      const fc = fcRef.current;
      if (!fc) return null;
      fc.discardActiveObject();
      fc.renderAll();
      return fc.toDataURL({ format: 'png', multiplier: 1 });
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

  // Redraw whenever the design changes.
  useEffect(() => {
    const fc = fcRef.current;
    if (!fc) return;

    const ratio = aspectRatio(design.layout?.canvas?.aspect);
    const W = CANVAS_W;
    const H = Math.round(W / ratio);
    fc.setDimensions({ width: W, height: H });

    // Background
    const bg = design.selections.background?.snapshot?.meta;
    fc.backgroundColor = bg?.type === 'color' && bg?.value ? bg.value : '#f5efe6';

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
        });
        group.elementIndex = index;
        fc.add(group);
      }
    });

    fc.renderAll();
  }, [design]);

  return (
    <div className="flex justify-center">
      <canvas ref={elRef} className="rounded-lg border border-gray-200 shadow-sm" />
    </div>
  );
});

export default FabricCanvas;
