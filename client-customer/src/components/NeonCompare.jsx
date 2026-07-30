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

export function CraftedSection({ crafted }) {
  if (!crafted?.body) return null;
  const images = (crafted.images || []).filter(Boolean);
  return (
    <motion.section
      variants={rise}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      className="overflow-hidden rounded-2xl border border-indigo-500/30 bg-linear-to-br from-indigo-600/20 via-indigo-600/10 to-transparent p-6 sm:p-8"
    >
      <div className="grid items-center gap-6 lg:grid-cols-2">
        <div>
          <h3 className="font-display text-2xl font-medium text-white sm:text-3xl">{crafted.heading}</h3>
          <p className="mt-3 max-w-md leading-relaxed text-slate-300">{crafted.body}</p>
        </div>
        {images.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {images.slice(0, 4).map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                className={`h-32 w-full rounded-xl object-cover shadow-lg sm:h-36 ${i % 2 ? 'translate-y-3' : ''}`}
              />
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
}
