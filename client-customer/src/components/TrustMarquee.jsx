// The dark ribbon of promises that slides across the home page. A marquee
// rather than a static row because there are more claims than fit a line, and
// motion is what makes people read a strip they'd otherwise skip past.
//
// The loop is seamless by rendering the list twice and translating exactly
// -50%: at the halfway point the second copy sits precisely where the first
// started, so the jump back to 0 is invisible. It hovers to pause, and stops
// entirely for anyone who asked for reduced motion.
//
// Rows come from Site content > marquee; `icon` picks one of the glyphs below.

const ICONS = {
  delivery: (
    <>
      <path d="M12 22 L28 15 L44 22 L28 29 Z" />
      <path d="M12 22 V38 L28 45 L44 38 V22" />
      <path d="M28 29 V45" />
    </>
  ),
  warranty: (
    <>
      <circle cx="28" cy="24" r="13" />
      <path d="M22 24 l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 35 L16 48 L28 42 L40 48 L36 35" strokeLinejoin="round" />
    </>
  ),
  rating: (
    <>
      <circle cx="21" cy="20" r="6" />
      <circle cx="35" cy="20" r="6" />
      <path d="M9 40a12 12 0 0 1 24 0" strokeLinecap="round" />
      <path d="M23 40a12 12 0 0 1 24 0" strokeLinecap="round" />
    </>
  ),
  quality: (
    <>
      <circle cx="28" cy="22" r="12" />
      <circle cx="28" cy="22" r="6" />
      <path d="M19 33 L15 48 L28 41 L41 48 L37 33" strokeLinejoin="round" />
    </>
  ),
  value: (
    <>
      <path d="M20 30 V16a4 4 0 0 1 8 0v12" strokeLinecap="round" />
      <path d="M28 28v-6a4 4 0 0 1 8 0v6" strokeLinecap="round" />
      <path d="M36 28v-3a4 4 0 0 1 8 0v13a10 10 0 0 1-10 10h-5a9 9 0 0 1-7-3.5L14 36a4 4 0 0 1 6-5z" strokeLinejoin="round" />
    </>
  ),
  install: (
    <>
      <path d="M34 12a9 9 0 0 0-11 11L11 35a4 4 0 0 0 6 6l12-12a9 9 0 0 0 11-11l-6 6-5-5z" strokeLinejoin="round" />
      <path d="M32 32 L44 44" strokeLinecap="round" />
    </>
  ),
};

// Each glyph gets its own tint so the ribbon reads as a row of distinct marks
// rather than one repeated shape.
const TINTS = [
  ['#a5f3d0', '#ffffff'],
  ['#6ee7a8', '#d9f99d'],
  ['#fde68a', '#fca5a5'],
  ['#5eead4', '#22d3ee'],
  ['#c4b5fd', '#f0abfc'],
  ['#93c5fd', '#67e8f9'],
];

function Glyph({ name, index }) {
  const id = `tmGrad${index % TINTS.length}`;
  return (
    <svg viewBox="0 0 56 56" className="h-7 w-7 shrink-0" fill="none" strokeWidth="2.6" stroke={`url(#${id})`} aria-hidden="true">
      {ICONS[name] || ICONS.quality}
    </svg>
  );
}

export default function TrustMarquee({ items }) {
  const rows = (items || []).filter((r) => r?.label);
  if (!rows.length) return null;

  // Two identical passes — the second is what the first scrolls into.
  const pass = rows.map((r, i) => (
    <span key={`${r.label}-${i}`} className="flex shrink-0 items-center gap-3 px-7">
      <Glyph name={r.icon} index={i} />
      <span className="whitespace-nowrap text-[15px] font-bold text-white">{r.label}</span>
    </span>
  ));

  return (
    <section className="relative overflow-hidden bg-[#0a0a0f] py-4" aria-label="Why shop with us">
      <style>{`
        @keyframes tmScroll { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        .tm-track { animation: tmScroll 32s linear infinite; }
        .tm-strip:hover .tm-track { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .tm-track { animation: none; }
        }
      `}</style>

      {/* Fade the ends so items enter and leave instead of being chopped off */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-linear-to-r from-[#0a0a0f] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-linear-to-l from-[#0a0a0f] to-transparent" />

      <svg width="0" height="0" aria-hidden="true" className="absolute">
        <defs>
          {TINTS.map(([a, b], i) => (
            <linearGradient key={i} id={`tmGrad${i}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} />
            </linearGradient>
          ))}
        </defs>
      </svg>

      <div className="tm-strip">
        <div className="tm-track flex w-max items-center">
          {pass}
          {/* aria-hidden: the duplicate is scenery, not content to read twice */}
          <span className="flex" aria-hidden="true">{pass}</span>
        </div>
      </div>
    </section>
  );
}
