// A neon sign that designs itself — the home page's demo of the Neon Studio.
// It types a phrase onto a laser-cut backboard, cycles the colour, steps
// through the sizes, cuts the power and brings it back, then moves to the next
// script and starts over.
//
// Adapted from the Claude Design "Neon Sign Studio" comp. The comp ran as a
// standalone page; here it is a home-page section, so it also links into the
// real studio and the price is shown as an estimate — the authoritative one is
// computed server-side at add-to-cart (INVARIANT 2), and a demo must not read
// as a quote.
//
// The loop is a cancellable async walk rather than chained setTimeouts, so
// unmounting mid-word stops it cleanly instead of leaving timers writing to a
// dead component.

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ensureGoogleFont } from '../lib/loadFont';
import { formatPaise } from '../utils/money';

const FONTS = [
  { label: 'Pacifico', family: "'Pacifico', cursive" },
  { label: 'Great Vibes', family: "'Great Vibes', cursive" },
  { label: 'Lobster', family: "'Lobster', cursive" },
];

const COLOURS = ['#ff3d9a', '#31b6ff', '#3ee68a', '#c07bff', '#ff6b3d', '#ffd23d'];

// Prices are paise, like everywhere else on the site (INVARIANT 1) — no float
// money, even in a demo.
const SIZES = [
  { label: 'Mini', dims: '9 × 30 cm', fontSize: 30, basePaise: 140000 },
  { label: 'Small', dims: '11 × 40 cm', fontSize: 40, basePaise: 180000 },
  { label: 'Medium', dims: '15 × 60 cm', fontSize: 54, basePaise: 260000 },
];
const PER_CHAR_PAISE = 6000;
const MAX_CHARS = 40;

const SCRIPTS = [
  { text: 'good vibes only', font: 0, colour: 0, size: 2 },
  { text: 'open late', font: 2, colour: 1, size: 1 },
  { text: 'Rahul & Disha', font: 1, colour: 3, size: 2 },
];

const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function NeonStudioPreview() {
  const [step, setStep] = useState(0);
  const [text, setText] = useState('');
  const [font, setFont] = useState(0);
  const [colour, setColour] = useState(0);
  const [size, setSize] = useState(2);
  const [typing, setTyping] = useState(true);
  const [on, setOn] = useState(true);
  const cancelled = useRef(false);

  useEffect(() => { FONTS.forEach((f) => ensureGoogleFont(f.label)); }, []);

  useEffect(() => {
    cancelled.current = false;
    const sc = SCRIPTS[step];

    if (reduced()) {
      setText(sc.text); setFont(sc.font); setColour(sc.colour); setSize(sc.size);
      setTyping(false); setOn(true);
      return undefined;
    }

    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const dead = () => cancelled.current;

    (async () => {
      setText(''); setTyping(true); setOn(true);
      setFont(sc.font); setSize(sc.size); setColour(sc.colour);
      await wait(650); if (dead()) return;

      for (let i = 1; i <= sc.text.length; i += 1) {
        setText(sc.text.slice(0, i));
        await wait(70 + Math.random() * 70);
        if (dead()) return;
      }
      setTyping(false);
      await wait(900); if (dead()) return;

      // Show off the colour range, then settle back on the script's own.
      for (const c of [(sc.colour + 1) % COLOURS.length, (sc.colour + 3) % COLOURS.length, sc.colour]) {
        setColour(c);
        await wait(750); if (dead()) return;
      }
      await wait(300); if (dead()) return;

      for (const z of [0, 1, sc.size]) {
        setSize(z);
        await wait(750); if (dead()) return;
      }
      await wait(400); if (dead()) return;

      // Power cut — the moment that sells it as a real object in a real room.
      setOn(false);
      await wait(900); if (dead()) return;
      setOn(true);
      await wait(2200); if (dead()) return;

      setStep((s) => (s + 1) % SCRIPTS.length);
    })();

    return () => { cancelled.current = true; };
  }, [step]);

  const hex = COLOURS[colour];
  const sz = SIZES[size];
  const glow = on
    ? `0 0 4px #fff, 0 0 11px ${hex}, 0 0 26px ${hex}, 0 0 52px ${hex}, 0 0 90px ${hex}`
    : '0 0 2px rgba(255,255,255,.12)';
  const totalPaise = sz.basePaise + text.length * PER_CHAR_PAISE;

  return (
    <section className="neon-demo bg-linear-to-b from-white to-[#eff5f1] px-4 py-16">
      <style>{`
        @keyframes nsCaret { 0%,45%{opacity:1} 50%,95%{opacity:0} 100%{opacity:1} }
        @keyframes nsRise { 0%{transform:translateY(14px);opacity:0} 100%{transform:translateY(0);opacity:1} }
        @keyframes nsHum { 0%,100%{opacity:1} 47%{opacity:.93} 52%{opacity:.99} }
        @keyframes nsScan { 0%,100%{opacity:.35} 50%{opacity:.6} }
        @media (prefers-reduced-motion: reduce) {
          .neon-demo, .neon-demo * { animation: none !important; }
        }
      `}</style>

      <div
        className="mx-auto flex max-w-6xl flex-col gap-7 rounded-3xl border border-[#1e2a25] px-6 py-12 shadow-[0_30px_80px_-40px_rgba(11,13,12,0.8)] sm:px-10"
        style={{ background: 'radial-gradient(90% 70% at 50% -10%, #16211d 0%, #0b0d0c 60%)' }}
      >
        <div className="flex flex-col gap-2 text-center" style={{ animation: 'nsRise .7s cubic-bezier(.2,.8,.25,1) both' }}>
          <h2 className="m-0 font-display text-3xl font-semibold tracking-tight text-[#eaf5f0] [text-shadow:0_0_22px_rgba(0,175,153,0.6)] sm:text-4xl">
            Neon Sign Studio
          </h2>
          <p className="m-0 text-sm text-[#7d9b8f]">
            Design a custom LED neon sign — live preview, size-based pricing, crafted to order.
          </p>
        </div>

        <div className="mx-auto grid w-full max-w-5xl items-start gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          {/* Preview */}
          <div className="flex flex-col gap-3.5" style={{ animation: 'nsRise .7s .1s cubic-bezier(.2,.8,.25,1) both' }}>
            <div
              className="relative aspect-16/11 overflow-hidden rounded-2xl border border-[#1e2a25]"
              style={{ background: 'linear-gradient(180deg, #2a1a17, #1a0f0e)' }}
            >
              {/* Brick wall behind the sign */}
              <div
                className="absolute inset-0 opacity-85"
                style={{
                  backgroundImage:
                    'linear-gradient(#00000055 2px, transparent 2px), linear-gradient(90deg, #00000055 2px, transparent 2px), linear-gradient(135deg, #55302a, #3a201c 60%, #24130f)',
                  backgroundSize: '100% 46px, 92px 100%, 100% 100%',
                }}
              />
              {/* The sign's light spilling onto the wall — this is what makes
                  the colour read as light rather than paint. */}
              <div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(60% 45% at 50% 52%, ${on ? `${hex}3d` : 'rgba(0,0,0,0)'} 0%, rgba(0,0,0,0) 70%)`,
                  animation: 'nsScan 4s ease-in-out infinite',
                  transition: 'background .4s',
                }}
              />
              <div className="absolute inset-0 bg-linear-to-b from-black/45 via-black/15 to-black/60" />

              <div className="absolute inset-0 grid place-items-center p-[8%]">
                <div
                  className="text-center leading-tight text-white"
                  style={{
                    fontFamily: FONTS[font].family,
                    fontSize: sz.fontSize,
                    opacity: on ? 1 : 0.22,
                    textShadow: glow,
                    transition: 'color .4s, text-shadow .4s, font-size .5s cubic-bezier(.2,.8,.25,1), opacity .3s',
                    animation: 'nsHum 3.2s ease-in-out infinite',
                  }}
                >
                  {text}
                  {typing && (
                    <span
                      className="ml-1 inline-block w-[3px] bg-white align-baseline shadow-[0_0_12px_#fff]"
                      style={{ height: '0.8em', animation: 'nsCaret 1s steps(1) infinite' }}
                    />
                  )}
                </div>
              </div>

              {/* Power toggle */}
              <div className="absolute left-4 top-4 flex gap-1 rounded-xl border border-[#24332c] bg-[#0c1210]/80 p-1 backdrop-blur-sm">
                {['On', 'Off'].map((label) => {
                  const active = (label === 'On') === on;
                  return (
                    <span
                      key={label}
                      className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
                        active ? (on ? 'bg-indigo-600 text-white' : 'bg-[#3a4b43] text-[#eaf5f0]') : 'text-[#7d9b8f]'
                      }`}
                    >
                      {label}
                    </span>
                  );
                })}
              </div>

              <div className="absolute bottom-4 right-4 font-mono text-[11px] tracking-[0.12em] text-white/60">
                {sz.dims}
              </div>
            </div>
            <p className="m-0 text-[12.5px] leading-relaxed text-[#6d8a7e]">
              Live preview on a laser-cut acrylic backboard. Dimensions match the selected size — power toggles to
              show how it reads in a real room.
            </p>
          </div>

          {/* Controls */}
          <div
            className="flex flex-col gap-5 rounded-2xl border border-[#1e2a25] bg-[#101614] p-6"
            style={{ animation: 'nsRise .7s .2s cubic-bezier(.2,.8,.25,1) both' }}
          >
            <div className="flex flex-col gap-2.5">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#5cc4b2]">Your text</span>
                <span className="font-mono text-[11px] text-[#55705f]">{MAX_CHARS - text.length} left</span>
              </div>
              <div
                className={`min-h-18 rounded-xl border-[1.5px] bg-[#0c1210] px-4 py-3.5 transition ${
                  typing ? 'border-indigo-600 shadow-[0_0_0_4px_rgba(0,175,153,0.13)]' : 'border-[#1e2a25]'
                }`}
              >
                <span className="font-mono text-[15px] text-[#dcece5]">{text}</span>
                {typing && (
                  <span className="ml-0.5 inline-block h-4 w-0.5 align-middle bg-indigo-600" style={{ animation: 'nsCaret 1s steps(1) infinite' }} />
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#5cc4b2]">Font style</span>
              <div className="grid grid-cols-3 gap-2">
                {FONTS.map((f, i) => (
                  <div
                    key={f.label}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border-[1.5px] px-1.5 py-3 transition ${
                      i === font ? 'border-indigo-600 bg-indigo-600/10' : 'border-[#1e2a25] bg-[#0c1210]'
                    }`}
                  >
                    <span className={`text-xl leading-none ${i === font ? 'text-[#eaf5f0]' : 'text-[#9ab5a9]'}`} style={{ fontFamily: f.family }}>Ag</span>
                    <span className={`text-[10.5px] ${i === font ? 'text-[#8fe0d2]' : 'text-[#61806f]'}`}>{f.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#5cc4b2]">Colour</span>
              <div className="flex flex-wrap gap-2.5">
                {COLOURS.map((c, i) => (
                  <span
                    key={c}
                    className="h-[30px] w-[30px] rounded-full transition"
                    style={{
                      background: c,
                      boxShadow: i === colour ? `0 0 0 2px #101614, 0 0 0 4px ${c}, 0 0 16px ${c}` : `0 0 10px ${c}66`,
                      transform: i === colour ? 'scale(1.12)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#5cc4b2]">Select size</span>
              <div className="grid grid-cols-3 gap-2">
                {SIZES.map((z, i) => (
                  <div
                    key={z.label}
                    className={`flex flex-col gap-1.5 rounded-xl border-[1.5px] px-2.5 py-3 transition ${
                      i === size ? 'border-indigo-600 bg-indigo-600/10' : 'border-[#1e2a25] bg-[#0c1210]'
                    }`}
                  >
                    <span className={`text-[12.5px] font-medium ${i === size ? 'text-[#eaf5f0]' : 'text-[#9ab5a9]'}`}>{z.label}</span>
                    <span className="font-mono text-[10.5px] text-[#6b8a7c]">{z.dims}</span>
                    <span className={`font-mono text-xs ${i === size ? 'text-[#4fd6c4]' : 'text-[#7d9b8f]'}`}>
                      {formatPaise(z.basePaise)}+
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-[#1e2a25] pt-3.5">
              <span className="flex flex-col gap-0.5">
                {/* "Estimate", not "Total" — the real price is computed
                    server-side at add-to-cart, and a demo must not read as a quote. */}
                <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#55705f]">Estimate</span>
                <span className="font-mono text-[19px] text-[#eaf5f0]">{formatPaise(totalPaise)}</span>
              </span>
              <Link
                to="/neon"
                className="rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 active:scale-[0.98]"
              >
                Design yours
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
