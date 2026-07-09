// Visual position builder — drag the admin's text fields onto the base plate
// (Canva-style), dependency-free. Each field renders as a draggable chip over
// the plate image; dropping it writes the normalized x/y back to the template.
// Precise size/colour/capabilities stay in the field form below.

import { useRef, useState } from 'react';

export default function TemplateCanvasBuilder({ baseImageUrl, aspect = 0.5, fields = [], onMove }) {
  const areaRef = useRef(null);
  const dragging = useRef(null); // { index }
  const [activeIndex, setActiveIndex] = useState(null);

  const clamp = (v) => Math.min(1, Math.max(0, v));

  const pointFromEvent = (e) => {
    const rect = areaRef.current.getBoundingClientRect();
    return {
      x: clamp((e.clientX - rect.left) / rect.width),
      y: clamp((e.clientY - rect.top) / rect.height),
    };
  };

  const onPointerDown = (e, index) => {
    e.preventDefault();
    dragging.current = { index };
    setActiveIndex(index);
    try { e.target.setPointerCapture(e.pointerId); } catch { /* ignore */ }
  };
  const onPointerMove = (e) => {
    if (!dragging.current) return;
    const { x, y } = pointFromEvent(e);
    onMove(dragging.current.index, x, y);
  };
  const onPointerUp = () => { dragging.current = null; };

  // Only active fields are shown; keep their real index for onMove.
  const shown = fields.map((f, i) => ({ f, i })).filter(({ f }) => f.status !== 'inactive' && f.key);

  return (
    <div>
      <div
        ref={areaRef}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        className="relative mx-auto w-full max-w-xl select-none overflow-hidden rounded-lg border border-slate-300 bg-slate-100"
        style={{ aspectRatio: `1 / ${aspect || 0.5}` }}
      >
        {baseImageUrl ? (
          <img src={baseImageUrl} alt="plate" className="pointer-events-none absolute inset-0 h-full w-full object-cover" draggable={false} />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-sm text-slate-400">Upload a base plate image to position fields</div>
        )}

        {shown.map(({ f, i }) => (
          <button
            key={i}
            type="button"
            onPointerDown={(e) => onPointerDown(e, i)}
            className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-move whitespace-nowrap rounded px-2 py-0.5 text-center shadow ${activeIndex === i ? 'ring-2 ring-indigo-500' : ''}`}
            style={{
              left: `${(f.x ?? 0.5) * 100}%`,
              top: `${(f.y ?? 0.5) * 100}%`,
              color: f.defaultColorHex || '#1a1a1a',
              fontFamily: f.defaultFontFamily || 'inherit',
              fontSize: `${Math.max(11, Math.min(40, (f.defaultSizePx || 40) * 0.5))}px`,
              background: 'rgba(255,255,255,0.7)',
            }}
            title={`${f.label} — drag to position`}
          >
            {f.defaultValue || f.label || f.key}
          </button>
        ))}
      </div>
      <p className="mt-2 text-center text-xs text-slate-400">Drag each field onto the plate. Exact size, colour and behaviour are set in the field list below.</p>
    </div>
  );
}
