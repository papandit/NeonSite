// A nameplate that types itself — the home page's demo of the Name Plate
// Studio. A brushed-steel plate on the left updates letter by letter while the
// two fields on the right show the text being entered, then it moves to the
// next preset and starts over.
//
// Adapted from the Claude Design "Nameplate Live Preview" comp. The comp ran
// as a standalone page; here it is a home-page section, so it also carries the
// preset chips (the comp computed them but never rendered them) and a link
// into the real studio — the point of showing this is to get someone to try it.
//
// The loop is a cancellable async walk rather than a chain of setTimeouts, so
// unmounting mid-word or clicking a chip stops it cleanly instead of leaving
// stray timers writing to a dead component.

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ensureGoogleFont } from '../lib/loadFont';

const PRESETS = [
  { surname: 'Patel Family', names: 'Rahul & Disha' },
  { surname: 'Agrawals', names: 'Sachin & Sima' },
  { surname: 'The Menons', names: 'Arjun & Nila' },
];

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Four corner screws — the detail that sells it as a physical object.
function Screw({ className }) {
  return (
    <span
      className={`absolute h-2.5 w-2.5 rounded-full shadow-[inset_0_0_2px_rgba(0,0,0,0.5)] ${className}`}
      style={{ background: 'radial-gradient(circle at 35% 30%, #fff, #9aa8a2)' }}
    />
  );
}

export default function NameplateLivePreview() {
  const [preset, setPreset] = useState(0);
  const [surname, setSurname] = useState('');
  const [names, setNames] = useState('');
  const [field, setField] = useState('surname'); // which input holds the caret
  const cancelled = useRef(false);

  useEffect(() => {
    ensureGoogleFont('Yatra One');
    ensureGoogleFont('IBM Plex Mono');
  }, []);

  useEffect(() => {
    cancelled.current = false;
    const p = PRESETS[preset];

    // Reduced motion: no typing theatre, just the finished plate.
    if (prefersReducedMotion()) {
      setSurname(p.surname);
      setNames(p.names);
      setField(null);
      return undefined;
    }

    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    // Varying the delay per keystroke is what makes it read as typing rather
    // than a marquee.
    const keyDelay = () => 75 + Math.random() * 65;

    (async () => {
      setSurname('');
      setNames('');
      setField('surname');
      await wait(700);
      if (cancelled.current) return;

      for (let i = 1; i <= p.surname.length; i += 1) {
        setSurname(p.surname.slice(0, i));
        await wait(keyDelay());
        if (cancelled.current) return;
      }
      await wait(600);
      if (cancelled.current) return;

      setField('names');
      await wait(350);
      for (let i = 1; i <= p.names.length; i += 1) {
        setNames(p.names.slice(0, i));
        await wait(keyDelay());
        if (cancelled.current) return;
      }

      setField(null);
      await wait(2600);
      if (cancelled.current) return;
      setPreset((n) => (n + 1) % PRESETS.length);
    })();

    return () => { cancelled.current = true; };
  }, [preset]);

  const Caret = () => (
    <span className="ml-0.5 inline-block h-5 w-0.5 bg-indigo-600" style={{ animation: 'npCaret 1s steps(1) infinite' }} />
  );

  const fieldShell = (active) =>
    `flex min-h-13 items-center rounded-xl border-[1.5px] bg-[#fbfdfc] px-4 transition ${
      active ? 'border-indigo-600 shadow-[0_0_0_4px_rgba(0,175,153,0.14)]' : 'border-[#dcedea]'
    }`;

  return (
    <section className="bg-linear-to-b from-[#eff5f1] to-white px-4 py-16">
      <style>{`
        @keyframes npCaret { 0%,45%{opacity:1} 50%,95%{opacity:0} 100%{opacity:1} }
        @keyframes npPlateIn { 0%{transform:translateY(18px) rotateX(8deg);opacity:0} 100%{transform:translateY(0) rotateX(0);opacity:1} }
        @keyframes npSheen { 0%{transform:translateX(-140%) skewX(-18deg)} 100%{transform:translateX(240%) skewX(-18deg)} }
        @media (prefers-reduced-motion: reduce) {
          .np-anim, .np-anim * { animation: none !important; }
        }
      `}</style>

      <div className="np-anim mx-auto grid max-w-6xl overflow-hidden rounded-3xl border border-[#d6ebe7] bg-white shadow-[0_30px_80px_-40px_rgba(24,52,43,0.6)] lg:grid-cols-[1.15fr_0.85fr]">
        {/* Plate */}
        <div
          className="relative grid place-items-center px-8 py-14 sm:px-14"
          style={{ background: 'radial-gradient(120% 100% at 30% 10%, #2f4b41 0%, #1d322b 55%, #16261f 100%)' }}
        >
          {/* Faint diagonal weave, so the dark panel isn't a flat block */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.16]"
            style={{ background: 'repeating-linear-gradient(115deg, rgba(255,255,255,.10) 0 2px, rgba(0,0,0,0) 2px 7px)' }}
          />

          <div className="relative w-full max-w-[430px]" style={{ animation: 'npPlateIn .8s cubic-bezier(.2,.8,.25,1) both' }}>
            <div
              className="relative overflow-hidden rounded-md px-4 pb-3 pt-4 shadow-[0_22px_50px_-18px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.9)]"
              style={{ background: 'linear-gradient(135deg, #d7ded9 0%, #f2f5f3 22%, #c8d2cd 48%, #eef2f0 70%, #ccd6d1 100%)' }}
            >
              {/* Brushed grain */}
              <div
                className="pointer-events-none absolute inset-0 opacity-50"
                style={{ background: 'repeating-linear-gradient(90deg, rgba(255,255,255,.55) 0 1px, rgba(120,135,128,.12) 1px 3px)' }}
              />
              {/* Light sweeping across the metal */}
              <div
                className="pointer-events-none absolute left-0 top-0 h-full w-2/5"
                style={{
                  background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.75), rgba(255,255,255,0))',
                  animation: 'npSheen 5.5s 1s cubic-bezier(.4,0,.2,1) infinite',
                }}
              />

              <Screw className="left-2.5 top-2.5" />
              <Screw className="right-2.5 top-2.5" />
              <Screw className="bottom-2.5 left-2.5" />
              <Screw className="bottom-2.5 right-2.5" />

              {/* Engraved rule above the text */}
              <div
                className="relative mx-4 h-3.5 opacity-85"
                style={{
                  background: 'repeating-linear-gradient(90deg, transparent 0 4px, #1c1c1c 4px 5px, transparent 5px 9px)',
                  maskImage: 'linear-gradient(180deg, #000 0 60%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(180deg, #000 0 60%, transparent 100%)',
                }}
              />

              <div className="relative flex min-h-27 flex-col items-center justify-center gap-0.5 px-6 pb-1 pt-1.5">
                <div className="min-h-4 font-mono text-xs uppercase tracking-[0.3em] text-[#2a2a2a]">{names}</div>
                <div
                  className="min-h-12 text-center text-[44px] leading-tight text-[#141414] [text-shadow:0_1px_0_rgba(255,255,255,0.6)]"
                  style={{ fontFamily: "'Yatra One', cursive" }}
                >
                  {surname}
                </div>
              </div>

              {/* Engraved rule below */}
              <div
                className="relative mx-3.5 mt-1 h-5.5 opacity-80"
                style={{
                  background: 'repeating-linear-gradient(90deg, #1c1c1c 0 3px, transparent 3px 6px, #1c1c1c 6px 8px, transparent 8px 16px)',
                  maskImage: 'linear-gradient(0deg, #000 0 55%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(0deg, #000 0 55%, transparent 100%)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-7 bg-white px-8 py-12 sm:px-12">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-indigo-600">Customise</span>
            <h2 className="m-0 font-display text-3xl font-semibold tracking-tight text-[#17322a]">Your nameplate</h2>
            <p className="m-0 text-sm leading-relaxed text-[#6a857b]">
              Type a surname and the names — the plate updates as you type.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-medium text-[#3d5c51]">Surname</label>
            <div className={fieldShell(field === 'surname')}>
              <span className="font-mono text-base text-[#17322a]">{surname}</span>
              {field === 'surname' && <Caret />}
              {!surname && field !== 'surname' && (
                <span className="font-mono text-base text-[#b5c6bf]">e.g. Patel Family</span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-medium text-[#3d5c51]">Name(s)</label>
            <div className={fieldShell(field === 'names')}>
              <span className="font-mono text-base text-[#17322a]">{names}</span>
              {field === 'names' && <Caret />}
              {!names && field !== 'names' && (
                <span className="font-mono text-base text-[#b5c6bf]">e.g. Rahul &amp; Disha</span>
              )}
            </div>
          </div>

          {/* The comp computed these chips but never rendered them — they turn a
              loop you watch into something you can steer. */}
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p, i) => (
              <button
                key={p.surname}
                type="button"
                onClick={() => setPreset(i)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                  i === preset
                    ? 'border-indigo-600 bg-indigo-50 text-[#00594f]'
                    : 'border-[#dcedea] bg-white text-[#7a938a] hover:border-indigo-300'
                }`}
              >
                {p.surname}
              </button>
            ))}
          </div>

          <Link
            to="/nameplates"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Design yours
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
