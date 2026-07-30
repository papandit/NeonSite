// "Glow smarter with FloRo" — a feature comparison table plus the workshop
// story. Both are admin-editable (Site content › compare / crafted) and hide
// themselves when emptied.

import { motion } from 'framer-motion';

const rise = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } } };

function Tick() {
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.45)]">
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5">
        <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
function Cross() {
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.45)]">
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3 w-3">
        <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
      </svg>
    </span>
  );
}

// Two diagonal marquee ribbons drift behind the table, exactly like the
// reference. Pure CSS keyframes so nothing runs on the main thread.
function RatingRibbon({ y, dir, duration }) {
  const cell = (
    <span className="flex shrink-0 items-center gap-2 px-8 text-lg font-medium text-slate-300 sm:text-xl">
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-cyan-300" fill="currentColor" aria-hidden="true">
        <circle cx="8" cy="9" r="3" /><circle cx="16" cy="9" r="3" opacity=".7" />
        <path d="M2 20a6 6 0 0 1 12 0z" /><path d="M10 20a6 6 0 0 1 12 0z" opacity=".7" />
      </svg>
      4.9 Star Rating by 10K+ Customers
    </span>
  );
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 w-[240%] -translate-x-1/2 overflow-hidden"
      style={{ top: y, transform: `translateX(-50%) rotate(${dir}deg)` }}
    >
      <div className="flex w-max" style={{ animation: `ncMarquee ${duration}s linear infinite${dir < 0 ? ' reverse' : ''}` }}>
        {Array.from({ length: 12 }, (_, i) => <span key={i} className="flex">{cell}</span>)}
      </div>
    </div>
  );
}

export function CompareTable({ compare }) {
  const rows = compare?.rows || [];
  if (!rows.length) return null;
  return (
    <motion.section
      id="neon-compare"
      variants={rise}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      className="relative -mx-4 scroll-mt-32 overflow-hidden px-4 py-10 sm:py-14"
    >
      <style>{`@keyframes ncMarquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
      <RatingRibbon y="18%" dir={-4} duration={38} />
      <RatingRibbon y="58%" dir={-4} duration={52} />

      <div className="relative mx-auto max-w-2xl overflow-hidden rounded-xl border border-white/15 bg-black shadow-[0_0_60px_rgba(0,0,0,0.9)]">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-emerald-400 text-slate-900">
              <th className="px-4 py-4 text-base font-bold sm:px-6">{compare.heading}</th>
              <th className="w-24 px-3 py-4 text-center text-base font-bold sm:w-32">{compare.usLabel || 'Us'}</th>
              <th className="w-24 px-3 py-4 text-center text-base font-bold sm:w-32">{compare.themLabel || 'Them'}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="border-t border-white/15 px-4 py-4 text-[15px] text-white sm:px-6">{r}</td>
                <td className="border-l border-t border-white/15 px-3 py-4 text-center"><Tick /></td>
                <td className="border-l border-t border-white/15 px-3 py-4 text-center"><Cross /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}

// Scattered workshop collage — four tilted, white-bordered photos overlapping
// on a brand-coloured band, the way the reference lays them out. Positions are
// fixed percentages inside a fixed-ratio box so the arrangement holds at every
// width; missing photos simply leave their slot empty.
// A 2x2 "cross" scatter: the pairs step diagonally past each other so the tiles
// overlap at the middle instead of sitting on a tidy grid line, and each tile
// tilts the opposite way to its neighbour.
const TILES = [
  { left: '4%', top: '-6%', w: '50%', ratio: '5 / 4', rot: -5, z: 3 },
  { left: '48%', top: '4%', w: '50%', ratio: '4 / 3', rot: 4, z: 2 },
  { left: '0%', top: '40%', w: '48%', ratio: '4 / 3', rot: 3, z: 4 },
  { left: '44%', top: '52%', w: '54%', ratio: '5 / 4', rot: -4, z: 5 },
];

export function CraftedSection({ crafted }) {
  if (!crafted?.body) return null;
  const images = (crafted.images || []).filter(Boolean).slice(0, 4);
  const paras = String(crafted.body).split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean);

  return (
    <motion.section
      variants={rise}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      className="-mx-4 overflow-hidden bg-indigo-600 px-4 py-10 sm:py-14"
    >
      <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-6">
        <div>
          <h3 className="font-display text-3xl font-semibold leading-tight text-white sm:text-4xl">{crafted.heading}</h3>
          {paras.map((t, i) => (
            <p key={i} className="mt-4 max-w-md text-sm font-medium leading-relaxed text-white/90 sm:text-base">{t}</p>
          ))}
        </div>

        {images.length > 0 && (
          // The tiles overhang the band top and bottom, so the row needs breathing
          // room the padded section can't give it.
          <div className="relative w-full pb-[92%] sm:pb-[80%]">
            {images.map((src, i) => {
              const t = TILES[i];
              return (
                <motion.img
                  key={i}
                  src={src}
                  alt=""
                  loading="lazy"
                  initial={{ opacity: 0, y: 26, rotate: t.rot * 2.4 }}
                  whileInView={{ opacity: 1, y: 0, rotate: t.rot }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: i * 0.09, ease: 'easeOut' }}
                  className="absolute rounded-lg border-4 border-white object-cover shadow-[0_16px_38px_rgba(0,0,0,0.4)]"
                  style={{ left: t.left, top: t.top, width: t.w, aspectRatio: t.ratio, zIndex: t.z }}
                />
              );
            })}
          </div>
        )}
      </div>
    </motion.section>
  );
}

// Closing assurance strip — delivery / guarantee / craft / rating, on one dark
// pill. Rows come from Site content › assurance; `icon` picks one of the built-in
// glyphs below and an unknown key just falls back to the spark.
const ICONS = {
  delivery: (
    <>
      <path d="M12 22 L28 15 L44 22 L28 29 Z" />
      <path d="M12 22 V38 L28 45 L44 38 V22" />
      <path d="M28 29 V45" />
      <path d="M4 24 H9 M2 31 H9 M4 38 H9" strokeLinecap="round" />
    </>
  ),
  guarantee: (
    <>
      <circle cx="28" cy="22" r="13" />
      <circle cx="28" cy="22" r="8" />
      <path d="M24 22 l3 3 5.5-6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 33 L16 48 L28 42 L40 48 L36 33" strokeLinejoin="round" />
    </>
  ),
  handcrafted: (
    <>
      <path d="M38 10 C22 10 14 18 14 26 c0 5 4 8 9 8 h10" strokeLinecap="round" />
      <path d="M18 46 C34 46 42 38 42 30 c0-5-4-8-9-8 H23" strokeLinecap="round" />
    </>
  ),
  rated: (
    <>
      <path d="M18 26 h6 v18 h-6 z" />
      <path d="M24 26 l7-14 a5 5 0 0 1 5 5 l-2 9 h9 a4 4 0 0 1 4 5 l-3 11 a5 5 0 0 1-5 4 H24 z" strokeLinejoin="round" />
      <path d="M14 50 l3-3 M22 51 l1-3 M30 51 l1-3 M38 51 l1-3" strokeLinecap="round" />
    </>
  ),
};

function AssuranceIcon({ name, gradId }) {
  return (
    <svg viewBox="0 0 56 56" className="h-11 w-11 shrink-0" fill="none" strokeWidth="2.4" stroke={`url(#${gradId})`}>
      {ICONS[name] || ICONS.guarantee}
    </svg>
  );
}

export function AssuranceBar({ items }) {
  const rows = (items || []).filter((r) => r?.title);
  if (!rows.length) return null;
  return (
    <motion.section
      variants={rise}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
      className="pt-2"
    >
      {/* One gradient per row index, so each glyph gets its own tint */}
      <svg width="0" height="0" aria-hidden="true" className="absolute">
        <defs>
          {[['#6ee7a8', '#d9f99d'], ['#5eead4', '#22d3ee'], ['#a78bfa', '#f0abfc'], ['#86efac', '#facc15']].map(([a, b], i) => (
            <linearGradient key={i} id={`ncAssure${i}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} />
            </linearGradient>
          ))}
        </defs>
      </svg>

      <div className="grid gap-6 rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-7 sm:grid-cols-2 sm:gap-7 lg:grid-cols-4 lg:px-8">
        {rows.slice(0, 4).map((r, i) => (
          <div key={i} className="flex items-center gap-3.5">
            <AssuranceIcon name={r.icon} gradId={`ncAssure${i % 4}`} />
            <div className="min-w-0">
              <div className="text-[15px] font-bold leading-tight text-white">{r.title}</div>
              {r.desc && <div className="mt-0.5 text-[13px] leading-snug text-slate-400">{r.desc}</div>}
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
