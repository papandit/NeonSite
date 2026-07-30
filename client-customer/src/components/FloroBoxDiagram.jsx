// FloRo "what's in the box" anatomy diagram — the RGBIC sibling of
// NeonBoxDiagram. Same 1200x640 stage and the same leader-line anatomy, but the
// sign is a flowing multi-colour gradient instead of a single glow colour, the
// leaders and hardware are tinted, and the cable carries a travelling pulse.
//
// Adapted from the Claude Design "FloRo Neon Diagram" comp. As with the neon
// version we measure the container and scale the fixed stage down, because a
// pure-CSS `scale(calc(100cqw / 1200))` is invalid — dividing a length by a
// number yields a length, and scale() needs a unitless number.

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ensureGoogleFont } from '../lib/loadFont';

const W = 1200;
const H = 640;
const LABEL = { fontSize: 19, fontWeight: 500, lineHeight: 1.3, color: '#e6e6ee' };

// The RGBIC sweep. Doubled so `background-size: 200%` can slide it seamlessly.
const SPECTRUM = '#2ee6f5 4%, #35e08a 30%, #b6f24a 42%, #ff4f96 60%, #ff5fd0 74%, #c86bff 92%';
const SPECTRUM_LIT = '#9df6ff 4%, #a8ffd6 30%, #e4ffae 42%, #ffb8d4 60%, #ffbdec 74%, #e2c4ff 92%';
const sweep = (stops) => `linear-gradient(95deg, ${stops}, ${stops})`;

export default function FloroBoxDiagram({
  word = 'FloRo Sign',
  tagline = '16 million colors · app controlled · dimmable',
}) {
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => { ensureGoogleFont('Kaushan Script'); }, []);

  // Scale the fixed 1200x640 stage down to whatever width we're given.
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const fit = () => setScale(Math.min(1, el.clientWidth / W));
    fit();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const tube = {
    fontFamily: "'Kaushan Script', cursive",
    fontSize: 118,
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
  };
  // Every glow layer is the same gradient text at a different blur — that stack
  // is what reads as "light spilling off the tube" rather than a flat fill.
  const lit = (blur, opacity, stops = SPECTRUM) => ({
    ...tube,
    position: 'absolute',
    inset: 0,
    display: 'grid',
    placeItems: 'center',
    background: sweep(stops),
    backgroundSize: '200% 100%',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    filter: `blur(${blur}px)`,
    opacity,
    animation: 'fbdShift 14s linear infinite',
  });

  return (
    <div ref={wrapRef} className="overflow-hidden rounded-2xl border border-white/10 bg-[#050506]">
      <style>{`
        @keyframes fbdShift { to { background-position: -200% 50% } }
        @keyframes fbdBreathe { 0%,100%{opacity:1} 48%{opacity:.94} 53%{opacity:.84} 58%{opacity:1} }
        @keyframes fbdDash { to { stroke-dashoffset: -240 } }
        @media (prefers-reduced-motion: reduce) {
          .fbd-anim, .fbd-anim * { animation: none !important; }
        }
      `}</style>

      <div className="relative w-full" style={{ height: H * scale }}>
        <div
          className="fbd-anim absolute left-0 top-0"
          style={{
            width: W,
            height: H,
            transformOrigin: 'top left',
            transform: `scale(${scale})`,
            background: 'radial-gradient(120% 90% at 50% 30%, #0a0a0f 0%, #030304 72%)',
            color: '#e8e8ef',
            fontFamily: "Helvetica, 'Helvetica Neue', Arial, sans-serif",
          }}
        >
          <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
            <defs>
              <linearGradient id="fbdLeadA" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#8ef0a8" /><stop offset="1" stopColor="#2ee6f5" />
              </linearGradient>
              <linearGradient id="fbdLeadB" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#4ef2b0" /><stop offset="1" stopColor="#2ee6f5" />
              </linearGradient>
              <linearGradient id="fbdCable" x1="1" y1="0" x2="0" y2="0">
                <stop offset="0" stopColor="#5ad8ff" /><stop offset="0.35" stopColor="#6b8bff" />
                <stop offset="0.7" stopColor="#ff5fd0" /><stop offset="1" stopColor="#ff8a6b" />
              </linearGradient>
            </defs>

            {/* leader lines — tinted per part */}
            <path d="M124 44 H600 V113" stroke="url(#fbdLeadA)" strokeWidth="1.5" fill="none" />
            <path d="M118 232 H248 V72 H310 V166" stroke="url(#fbdLeadB)" strokeWidth="1.5" fill="none" />
            <path d="M1006 84 H958" stroke="#9a9aa8" strokeWidth="1.4" fill="none" />
            <path d="M1006 178 H952" stroke="#9a9aa8" strokeWidth="1.4" fill="none" />
            <path d="M884 404 H822 L768 350" stroke="#ff8a6b" strokeWidth="1.5" fill="none" />

            {/* mains run, with a pulse travelling outlet-ward */}
            <path d="M768 244 V430 H198" stroke="url(#fbdCable)" strokeWidth="1.8" fill="none" />
            <path
              d="M768 244 V430 H198"
              stroke="#ffffff"
              strokeWidth="1.6"
              fill="none"
              strokeDasharray="12 228"
              opacity="0.75"
              style={{ animation: 'fbdDash 4.5s linear infinite' }}
            />

            <circle cx="600" cy="113" r="4.5" fill="#8ef0a8" />
            <circle cx="310" cy="167" r="10" fill="#2ee6f5" opacity="0.28" />
            <circle cx="310" cy="167" r="4.5" fill="#eafcff" />
            <circle cx="958" cy="84" r="4" fill="#d8d8e2" />
            <circle cx="952" cy="178" r="4" fill="#d8d8e2" />
            <circle cx="768" cy="350" r="4.5" fill="#ff8a6b" />

            {/* wall outlet, adaptor brick, FloRo controller */}
            <rect x="180" y="422" width="18" height="16" rx="4" fill="#08080b" stroke="#5ad8ff" strokeWidth="1.4" />
            <rect x="392" y="410" width="82" height="38" rx="6" fill="#08080b" stroke="#7a8cff" strokeWidth="1.4" />
            <path d="M474 418 H492" stroke="#7a8cff" strokeWidth="1.4" fill="none" />
            <rect x="642" y="418" width="34" height="48" rx="9" fill="#08080b" stroke="#ff5fd0" strokeWidth="1.4" />
            <circle cx="636" cy="416" r="6" fill="#08080b" stroke="#ff5fd0" strokeWidth="1.4" />
            <circle cx="690" cy="416" r="6" fill="#08080b" stroke="#ff5fd0" strokeWidth="1.4" />

            {/* screws + sticker sheet */}
            <g stroke="#d0d0da" strokeWidth="1.4" fill="none" strokeLinecap="round">
              {[[0, 0], [38, 16]].map(([dx, dy]) => (
                <g key={`${dx}-${dy}`} transform={`translate(${dx},${dy})`}>
                  <rect x="900" y="60" width="20" height="9" rx="2.5" fill="#0d0d10" />
                  <path d="M905 64 H915" />
                  <path d="M904 69 L910 122 L916 69" fill="#0d0d10" />
                  <path d="M905 79 H915 M906 88 H914 M907 97 H913 M908 106 H912" />
                </g>
              ))}
              <path d="M900 160 H952 V204 L942 214 H900 Z" fill="#0d0d10" />
              <path d="M952 204 L942 214 V204 Z" fill="#1c1c22" />
              <circle cx="914" cy="176" r="7" />
              <circle cx="936" cy="176" r="7" />
              <circle cx="914" cy="196" r="7" />
              <circle cx="936" cy="196" r="7" opacity="0.45" />
            </g>
          </svg>

          {/* the sign — acrylic edge layers behind a flowing RGBIC tube */}
          <div style={{ position: 'absolute', left: 150, right: 330, top: 42, height: 258, display: 'grid', placeItems: 'center' }}>
            <div style={{ position: 'relative', display: 'grid', placeItems: 'center', maxWidth: '100%' }}>
              <div aria-hidden="true" style={{ ...tube, position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'transparent', WebkitTextStroke: '34px #23232b', filter: 'blur(1px)' }}>{word}</div>
              <div aria-hidden="true" style={{ ...tube, position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'transparent', WebkitTextStroke: '28px #101014' }}>{word}</div>
              <div aria-hidden="true" style={lit(34, 0.95)}>{word}</div>
              <div aria-hidden="true" style={lit(13, 0.9)}>{word}</div>
              <div
                style={{
                  ...tube,
                  position: 'relative',
                  padding: '0 18px',
                  background: sweep(SPECTRUM_LIT),
                  backgroundSize: '200% 100%',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  animation: 'fbdShift 14s linear infinite, fbdBreathe 7s ease-in-out infinite',
                }}
              >
                {word}
              </div>
            </div>
          </div>

          {/* callouts */}
          <div style={{ ...LABEL, position: 'absolute', left: 20, top: 20, width: 120 }}>Acrylic<br />Backing</div>
          <div style={{ ...LABEL, position: 'absolute', left: 20, top: 208, width: 120 }}>FloRo<br />LED</div>
          <div style={{ ...LABEL, position: 'absolute', left: 1014, top: 74, width: 170 }}>Mounting<br />Screw Kit</div>
          <div style={{ ...LABEL, position: 'absolute', left: 1014, top: 182, width: 170 }}>Stickers<br />Sheet</div>
          <div style={{ ...LABEL, position: 'absolute', left: 886, top: 402, width: 150 }}>10 Feet<br />Transparent<br />Cable</div>
          <div style={{ ...LABEL, position: 'absolute', left: 138, top: 500, width: 120, textAlign: 'center' }}>Power<br />Outlet</div>
          <div style={{ ...LABEL, position: 'absolute', left: 376, top: 500, width: 120, textAlign: 'center' }}>Power<br />Adaptor</div>
          <div style={{ ...LABEL, position: 'absolute', left: 579, top: 500, width: 160, textAlign: 'center' }}>FloRo<br />Controller</div>

          <div style={{ position: 'absolute', left: 20, bottom: 18, display: 'flex', gap: 10, alignItems: 'center', fontSize: 12, letterSpacing: '.18em', textTransform: 'uppercase', color: '#55555f', fontFamily: 'ui-monospace, Menlo, monospace' }}>
            <span>floro led</span>
            <span style={{ width: 40, height: 1, background: '#2a2a30' }} />
            <span>{tagline}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
