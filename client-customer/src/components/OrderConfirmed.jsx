// The moment after checkout: a green tick that pops, draws itself, and throws
// a burst of sparks, over a card that rises in and a progress rail that fills.
//
// Adapted from the Claude Design "Order Confirmed" comp. It ran as a standalone
// page; here it is the banner at the top of a real order, so the copy, order
// number, ETA and stage all come from the order rather than being fixed. The
// comp's palette was already #589c80, so it needs no recolouring — it uses the
// brand tokens directly.
//
// Everything is CSS keyframes rather than JS animation: the whole thing runs on
// the compositor, and one `prefers-reduced-motion` rule turns the lot off.

import { useMemo, useState } from 'react';

// A ring of sparks thrown out from behind the tick. Angles are spread evenly
// with a small offset so the burst doesn't line up with the card edges, and
// distance varies per spark so it reads as a spray, not a wheel.
function makeSparks(seed = 0) {
  const tints = ['#589c80', '#8ecdb1', '#c9e6d8', '#589c80'];
  return Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2 + 0.3;
    const distance = 78 + ((i + seed) % 3) * 20;
    const round = i % 3 !== 0;
    return {
      dx: `${Math.round(Math.cos(angle) * distance)}px`,
      dy: `${Math.round(Math.sin(angle) * distance)}px`,
      size: round ? 7 : 5,
      radius: round ? '50%' : '1px',
      color: tints[i % tints.length],
      delay: `${(0.55 + (i % 4) * 0.14).toFixed(2)}s`,
    };
  });
}

const STAGES = ['Confirmed', 'Packing', 'Shipped', 'Delivered'];

export default function OrderConfirmed({ orderNumber, name, arrives, stageIndex = 0, onTrack, onReceipt }) {
  // Bumping the key restarts every animation by remounting the subtree.
  const [runKey, setRunKey] = useState(0);
  const sparks = useMemo(() => makeSparks(runKey), [runKey]);

  return (
    <div
      key={runKey}
      className="oc-card relative overflow-hidden rounded-3xl border border-[#e0e9e5] bg-white px-8 pb-9 pt-11 shadow-[0_24px_60px_-30px_rgba(38,74,63,0.45)]"
    >
      <style>{`
        @keyframes ocRingPop { 0%{transform:scale(.4);opacity:0} 55%{transform:scale(1.08);opacity:1} 100%{transform:scale(1);opacity:1} }
        @keyframes ocHalo { 0%{transform:scale(.6);opacity:.55} 100%{transform:scale(2.1);opacity:0} }
        @keyframes ocDraw { to { stroke-dashoffset: 0 } }
        @keyframes ocRise { 0%{transform:translateY(14px);opacity:0} 100%{transform:translateY(0);opacity:1} }
        @keyframes ocCardIn { 0%{transform:translateY(28px) scale(.97);opacity:0} 100%{transform:translateY(0) scale(1);opacity:1} }
        @keyframes ocSpark { 0%{transform:translate(0,0) scale(0);opacity:0} 25%{opacity:1} 100%{transform:translate(var(--dx),var(--dy)) scale(1);opacity:0} }
        @keyframes ocFill { from { transform: scaleX(0) } to { transform: scaleX(1) } }
        @keyframes ocFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes ocDot { 0%,100%{opacity:.25;transform:scale(.85)} 50%{opacity:1;transform:scale(1)} }

        .oc-card { animation: ocCardIn .7s cubic-bezier(.2,.8,.25,1) both; }
        .oc-rise { animation: ocRise .6s cubic-bezier(.2,.8,.25,1) both; }

        /* One switch turns the whole celebration off for anyone who asked for
           less motion — they still get the card, just without the theatre. */
        @media (prefers-reduced-motion: reduce) {
          .oc-card, .oc-card * { animation: none !important; }
          .oc-check { stroke-dashoffset: 0 !important; }
        }
      `}</style>

      {/* Soft wash from the top, same as the comp */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-indigo-600/[0.07] to-transparent" />

      {/* Tick, halos and sparks */}
      <div className="relative grid h-36 place-items-center">
        <span
          className="absolute h-28 w-28 rounded-full bg-indigo-600"
          style={{ animation: 'ocHalo 1.9s .25s cubic-bezier(.2,.7,.3,1) infinite' }}
        />
        <span
          className="absolute h-28 w-28 rounded-full bg-indigo-600 opacity-[0.12]"
          style={{ animation: 'ocHalo 1.9s .95s cubic-bezier(.2,.7,.3,1) infinite' }}
        />

        <span
          className="relative grid h-26 w-26 place-items-center rounded-full shadow-[0_14px_34px_-12px_rgba(88,156,128,0.85)]"
          style={{
            background: 'linear-gradient(150deg, #6cb193, #589c80 55%, #46826a)',
            animation: 'ocRingPop .8s .15s cubic-bezier(.2,1.2,.3,1) both, ocFloat 4.5s 1s ease-in-out infinite',
          }}
        >
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none" aria-hidden="true">
            <path
              className="oc-check"
              d="M14 27.5 L22.5 36 L38 17"
              stroke="#ffffff"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="52"
              strokeDashoffset="52"
              style={{ animation: 'ocDraw .55s .62s cubic-bezier(.6,0,.2,1) forwards' }}
            />
          </svg>
        </span>

        <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden="true">
          {sparks.map((s, i) => (
            <span
              key={i}
              className="absolute"
              style={{
                width: s.size,
                height: s.size,
                borderRadius: s.radius,
                background: s.color,
                '--dx': s.dx,
                '--dy': s.dy,
                animation: `ocSpark 1.5s ${s.delay} cubic-bezier(.15,.7,.3,1) infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative mt-1.5 flex flex-col gap-2.5 text-center">
        <h2 className="oc-rise m-0 font-display text-[27px] font-semibold tracking-tight text-[#17322a]" style={{ animationDelay: '.75s' }}>
          Order confirmed
        </h2>
        <p className="oc-rise m-0 text-[15px] leading-relaxed text-[#5d7a70]" style={{ animationDelay: '.87s' }}>
          {name ? `Thanks, ${name}. ` : 'Thanks! '}
          We&apos;re packing your order now — you&apos;ll get a tracking link the moment it ships.
        </p>
      </div>

      <div
        className="oc-rise relative mt-6 flex items-center justify-between gap-3 rounded-2xl border border-[#e3ece8] bg-[#f4f8f6] px-4.5 py-3.5"
        style={{ animationDelay: '.99s' }}
      >
        <span className="flex flex-col gap-0.5">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#8aa79c]">Order</span>
          <span className="font-mono text-sm text-[#22493d]">{orderNumber}</span>
        </span>
        {arrives && (
          <span className="flex flex-col gap-0.5 text-right">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#8aa79c]">Arrives</span>
            <span className="font-mono text-sm text-[#22493d]">{arrives}</span>
          </span>
        )}
      </div>

      {/* Progress rail — fills to how far this order actually is */}
      <div className="oc-rise relative mt-6" style={{ animationDelay: '1.1s' }}>
        <div className="h-1 overflow-hidden rounded-full bg-[#e6eeea]">
          <div
            className="h-full rounded-full bg-linear-to-r from-indigo-600 to-[#7cbfa2]"
            style={{
              width: `${((stageIndex + 1) / STAGES.length) * 100}%`,
              transformOrigin: 'left',
              animation: 'ocFill 1.1s 1.15s cubic-bezier(.4,0,.2,1) both',
            }}
          />
        </div>
        <div className="mt-3 flex justify-between">
          {STAGES.map((label, i) => {
            const done = i <= stageIndex;
            const current = i === stageIndex + 1;
            return (
              <span key={label} className="flex items-center gap-[7px]">
                <span
                  className={`h-[7px] w-[7px] rounded-full ${done || current ? 'bg-indigo-600' : 'bg-[#d5e2dc]'}`}
                  style={current ? { animation: 'ocDot 1.6s 1.6s ease-in-out infinite' } : undefined}
                />
                <span className={`text-xs ${done ? 'text-[#22493d]' : current ? 'text-[#7b968b]' : 'text-[#a6b8b0]'}`}>{label}</span>
              </span>
            );
          })}
        </div>
      </div>

      {(onTrack || onReceipt) && (
        <div className="oc-rise relative mt-7 grid grid-cols-2 gap-2.5" style={{ animationDelay: '1.25s' }}>
          {onTrack && (
            <button
              onClick={onTrack}
              className="rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-medium text-white transition hover:bg-indigo-700 active:scale-[0.98]"
            >
              Track order
            </button>
          )}
          {onReceipt && (
            <button
              onClick={onReceipt}
              className="rounded-xl border border-[#dbe7e2] bg-white px-4 py-3.5 text-sm font-medium text-[#2d5648] transition hover:bg-[#f3f8f6] active:scale-[0.98]"
            >
              View receipt
            </button>
          )}
        </div>
      )}

      <div className="relative mt-5 flex justify-center">
        <button
          onClick={() => setRunKey((k) => k + 1)}
          className="inline-flex items-center gap-2 rounded-full border border-[#dde8e3] bg-white/70 px-4.5 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[#4d7a6b] transition hover:bg-white hover:text-[#2d5648]"
        >
          Replay animation
        </button>
      </div>
    </div>
  );
}
