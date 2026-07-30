// Animated "what's in the box" anatomy diagram — a glowing neon word with
// leader lines to every part that ships (acrylic backing, screw kit, stickers,
// cable, adaptor, controller, outlet).
//
// Adapted from the Claude Design "Neon Sign Diagram" comp. The original is a
// fixed 1200x640 stage; we measure the container and scale it down so the whole
// composition stays pixel-proportional at any width. (A pure-CSS `scale(calc(
// 100cqw / 1200))` can't work — dividing a length by a number yields a length,
// and scale() needs a unitless number.)

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ensureGoogleFont } from '../lib/loadFont';

const W = 1200;
const H = 640;
const CYCLE = ['#3df5ff', '#7cff5a', '#ff9b3d', '#c47bff', '#ff4d8d'];
const LABEL = { fontSize: 19, fontWeight: 500, lineHeight: 1.25, color: '#cfff4a' };

export default function NeonBoxDiagram({ word = 'Neon Sign', tagline = '10ft cable · dimmable · ships flat' }) {
  const [i, setI] = useState(0);
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

  // Colour cycle — paused for visitors who prefer reduced motion.
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const t = setInterval(() => setI((v) => (v + 1) % CYCLE.length), 3400);
    return () => clearInterval(t);
  }, []);

  const accent = CYCLE[i];
  const glow = [
    '0 0 4px #ffffff', '0 0 10px #ffffff',
    `0 0 20px ${accent}`, `0 0 40px ${accent}`,
    `0 0 75px ${accent}`, `0 0 130px ${accent}`,
  ].join(', ');

  const tube = { fontFamily: "'Kaushan Script', cursive", fontSize: 118, lineHeight: 1.4, whiteSpace: 'nowrap' };

  return (
    <div ref={wrapRef} className="overflow-hidden rounded-2xl border border-white/10 bg-[#050506]">
      <style>{`
        @keyframes nbdBreathe { 0%,100%{opacity:1} 47%{opacity:.97} 52%{opacity:.9} 56%{opacity:1} }
        @keyframes nbdDash { to { stroke-dashoffset: -220 } }
        @media (prefers-reduced-motion: reduce) {
          .nbd-breathe, .nbd-dash { animation: none !important; }
        }
      `}</style>

      <div className="relative w-full" style={{ height: H * scale }}>
        <div
          className="absolute left-0 top-0"
          style={{ width: W, height: H, transformOrigin: 'top left', transform: `scale(${scale})`, background: 'radial-gradient(120% 90% at 50% 28%, #0b0b10 0%, #030304 70%)', color: '#fff', fontFamily: "Helvetica, 'Helvetica Neue', Arial, sans-serif" }}
        >
          <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
            {/* leader lines */}
            <g stroke="#8a8a8a" strokeWidth="1.25" fill="none">
              <path d="M124 44 H600 V113" />
              <path d="M118 232 H248 V72 H304 V166" />
              <path d="M1006 84 H958" />
              <path d="M1006 178 H952" />
              <path d="M884 404 H822 L768 350" />
              <path d="M768 244 V430 H198" />
            </g>
            {/* current travelling down the cable */}
            <path
              className="nbd-dash"
              d="M768 244 V430 H198"
              stroke={accent}
              strokeWidth="1.25"
              fill="none"
              strokeDasharray="10 210"
              opacity="0.9"
              style={{ animation: 'nbdDash 4s linear infinite', transition: 'stroke 1.6s cubic-bezier(.4,0,.2,1)' }}
            />
            <circle cx="600" cy="113" r="4.5" fill="#fff" />
            <circle cx="304" cy="167" r="10" fill={accent} opacity="0.3" />
            <circle cx="304" cy="167" r="4.5" fill="#fff" />
            {/* adaptor brick, controller, wall outlet */}
            <rect x="398" y="412" width="76" height="34" rx="5" fill="#0a0a0c" stroke="#9a9a9a" strokeWidth="1.25" />
            <rect x="592" y="404" width="30" height="56" rx="15" fill="#0a0a0c" stroke="#9a9a9a" strokeWidth="1.25" />
            <circle cx="607" cy="422" r="5" fill="#9a9a9a" />
            <rect x="180" y="422" width="18" height="16" rx="4" fill="#0a0a0c" stroke="#9a9a9a" strokeWidth="1.25" />
            <circle cx="768" cy="350" r="4.5" fill="#fff" />
            <circle cx="958" cy="84" r="4" fill="#fff" />
            <circle cx="952" cy="178" r="4" fill="#fff" />
            {/* screws + sticker sheet */}
            <g stroke="#d6d6d6" strokeWidth="1.4" fill="none" strokeLinecap="round">
              {[[0, 0], [38, 16]].map(([dx, dy]) => (
                <g key={`${dx}-${dy}`} transform={`translate(${dx},${dy})`}>
                  <rect x="900" y="60" width="20" height="9" rx="2.5" fill="#0d0d10" />
                  <path d="M905 64 H915" />
                  <path d="M904 69 L910 122 L916 69" fill="#0d0d10" />
                  <path d="M905 79 H915 M906 88 H914 M907 97 H913 M908 106 H912" />
                </g>
              ))}
              <g>
                <path d="M900 160 H952 V214 H900 Z" fill="#0d0d10" />
                <path d="M900 160 H952 V204 L942 214 H900 Z" fill="#0d0d10" />
                <path d="M952 204 L942 214 V204 Z" fill="#1c1c22" />
                <circle cx="914" cy="176" r="7" />
                <circle cx="936" cy="176" r="7" />
                <circle cx="914" cy="196" r="7" />
                <circle cx="936" cy="196" r="7" opacity="0.45" />
              </g>
            </g>
          </svg>

          {/* the sign itself — acrylic edge layers behind a glowing tube */}
          <div style={{ position: 'absolute', left: 150, right: 330, top: 42, height: 258, display: 'grid', placeItems: 'center' }}>
            <div style={{ position: 'relative', display: 'grid', placeItems: 'center', maxWidth: '100%' }}>
              <div aria-hidden="true" style={{ ...tube, position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'transparent', WebkitTextStroke: '30px #34343f', filter: 'blur(0.6px)' }}>{word}</div>
              <div aria-hidden="true" style={{ ...tube, position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'transparent', WebkitTextStroke: '26px #1b1b22', filter: 'blur(0.6px)' }}>{word}</div>
              <div className="nbd-breathe" style={{ ...tube, position: 'relative', padding: '0 18px', animation: 'nbdBreathe 6s ease-in-out infinite' }}>
                <span style={{ display: 'inline-block', color: '#fdfdff', textShadow: glow, transition: 'text-shadow 1.6s cubic-bezier(.4,0,.2,1)' }}>{word}</span>
              </div>
            </div>
          </div>

          {/* callouts */}
          <div style={{ ...LABEL, position: 'absolute', left: 20, top: 20, width: 120 }}>Acrylic<br />Backing</div>
          <div style={{ ...LABEL, position: 'absolute', left: 20, top: 208, width: 120 }}>Neon<br />Light</div>
          <div style={{ ...LABEL, position: 'absolute', left: 1014, top: 74, width: 170 }}>Mounting<br />Screw Kit</div>
          <div style={{ ...LABEL, position: 'absolute', left: 1014, top: 182, width: 170 }}>Stickers<br />Sheet</div>
          <div style={{ ...LABEL, position: 'absolute', left: 886, top: 402, width: 150 }}>10 Feet<br />Transparent<br />Cable</div>
          <div style={{ ...LABEL, position: 'absolute', left: 138, top: 500, width: 120, textAlign: 'center' }}>Power<br />Outlet</div>
          <div style={{ ...LABEL, position: 'absolute', left: 376, top: 500, width: 120, textAlign: 'center' }}>Power<br />Adaptor</div>
          <div style={{ ...LABEL, position: 'absolute', left: 527, top: 500, width: 160, textAlign: 'center' }}>Brightness<br />Controller</div>

          <div style={{ position: 'absolute', left: 20, bottom: 18, display: 'flex', gap: 10, alignItems: 'center', fontSize: 12, letterSpacing: '.18em', textTransform: 'uppercase', color: '#4a4a52', fontFamily: 'ui-monospace, Menlo, monospace' }}>
            <span>custom neon</span>
            <span style={{ width: 40, height: 1, background: '#2a2a30' }} />
            <span>{tagline}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
