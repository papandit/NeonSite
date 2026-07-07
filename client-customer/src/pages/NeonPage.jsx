// Neon Sign Studio — a live LED-neon customizer. Text / font / colour / size /
// backing / scene, with a glowing preview and a price that scales with size and
// character count. The client shows a live ESTIMATE; the server reprices on
// add-to-cart and again at checkout (INVARIANT 2), so the charged price is
// always authoritative. Neon signs buy through the normal cart → checkout flow.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getNeonConfig } from '../services/neon';
import { addNeonToCart } from '../store/cartSlice';
import { selectIsAuthenticated } from '../store/authSlice';
import { formatPaise } from '../utils/money';
import { apiErrorMessage } from '../services/api';
import Seo from '../components/Seo';
import './neon.css';

export const PENDING_NEON_KEY = 'nc_pending_neon';

const charCountOf = (t) => (t || '').replace(/\s/g, '').length;

export default function NeonPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthed = useSelector(selectIsAuthenticated);

  const [cfg, setCfg] = useState(null);
  const [text, setText] = useState('good vibes only');
  const [font, setFont] = useState('');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [backing, setBacking] = useState('');
  const [scene, setScene] = useState('');
  const [on, setOn] = useState(true);
  const [powering, setPowering] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    getNeonConfig().then((c) => {
      setCfg(c);
      // Default to the first option of each once (only if unset).
      setFont((f) => f || c.fonts[0]?.key || '');
      setColor((v) => v || c.colors[0]?.key || '');
      setSize((v) => v || c.sizes[1]?.key || c.sizes[0]?.key || ''); // default Medium
      setBacking((v) => v || c.backings[0]?.key || '');
      setScene((v) => v || c.scenes[0]?.key || '');
    }).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  // Live refresh when the admin edits the neon catalogue.
  useEffect(() => {
    const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');
    const es = new EventSource(`${base}/events`);
    es.addEventListener('neon:changed', load);
    es.onerror = () => {};
    return () => es.close();
  }, [load]);

  const fontObj = useMemo(() => cfg?.fonts.find((f) => f.key === font), [cfg, font]);
  const colorObj = useMemo(() => cfg?.colors.find((c) => c.key === color), [cfg, color]);
  const sizeObj = useMemo(() => cfg?.sizes.find((s) => s.key === size), [cfg, size]);
  const backObj = useMemo(() => cfg?.backings.find((b) => b.key === backing), [cfg, backing]);

  const charCount = charCountOf(text);
  const estPaise = sizeObj
    ? sizeObj.basePricePaise + charCount * sizeObj.perCharPaise + (backObj?.priceDeltaPaise || 0)
    : 0;

  // Rough tube estimate (matches the server heuristic).
  const tubeMeters = sizeObj ? charCount * (sizeObj.cm / 60) * 0.22 * (fontObj?.script ? 1.25 : 1) : 0;
  const dimW = sizeObj?.cm || 0;
  const lines = (text || ' ').split('\n');
  const dimH = sizeObj ? Math.round((sizeObj.cm / 60) * (18 + (lines.length - 1) * 22)) : 0;

  const powerOn = () => {
    setOn(true);
    setPowering(true);
    setTimeout(() => setPowering(false), 750);
  };

  const handleAdd = async () => {
    if (!sizeObj || !text.trim()) { setError('Add some text and pick a size first.'); return; }
    setAdding(true);
    setError(null);
    const spec = { text, font, color, size, backing, scene };
    try {
      if (isAuthed) {
        await dispatch(addNeonToCart({ spec })).unwrap();
        navigate('/cart');
      } else {
        localStorage.setItem(PENDING_NEON_KEY, JSON.stringify(spec));
        navigate('/login', { state: { from: { pathname: '/neon' } } });
      }
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not add to cart'));
    } finally {
      setAdding(false);
    }
  };

  if (!cfg) {
    return <div className="grid min-h-[60vh] place-items-center bg-[#0a0a0f] text-slate-400">Lighting up the studio…</div>;
  }

  const pill = (active) =>
    `rounded-full border px-4 py-2 text-sm font-medium transition ${
      active ? 'border-pink-500 bg-pink-500/10 text-white' : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/25 hover:text-white'
    }`;

  return (
    <div className="bg-[#0a0a0f] text-slate-100" style={{
      backgroundImage:
        'radial-gradient(1200px 700px at 80% -10%, rgba(36,211,255,.06), transparent 60%), radial-gradient(900px 600px at 0% 110%, rgba(255,45,149,.06), transparent 55%)',
    }}>
      <Seo title="Neon Sign Studio" description="Design your own LED neon sign — text, font, colour, size — with a live glowing preview and instant pricing." path="/neon" />

      <div className="mx-auto max-w-6xl px-4 pb-40 pt-10">
        <header className="mb-8 text-center">
          <h1 className="font-display text-4xl font-semibold" style={{ color: '#ffd9ec', textShadow: '0 0 6px #ff2d95,0 0 16px #ff2d95,0 0 34px #ff2d95' }}>
            Neon Sign Studio
          </h1>
          <p className="mt-2 text-sm text-slate-400">Design a custom LED neon sign — live preview, size-based pricing, crafted to order.</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr] lg:items-start">
          {/* ---------- STAGE ---------- */}
          <div className="lg:sticky lg:top-24">
            <div className={`neon-stage ${scene || 'wall'}`}>
              <div
                className={`neon-sign ${on ? 'on' : 'off'} ${powering ? 'powering' : ''}`}
                style={{
                  fontFamily: fontObj?.cssFamily || 'cursive',
                  fontSize: `clamp(22px, 8vw, ${sizeObj?.fontSizePx || 46}px)`,
                  '--neon-fill': colorObj?.fill || '#fff',
                  '--neon-glow': colorObj?.glow || '#ff2d95',
                }}
              >
                {lines.map((l, i) => <span key={i} className="neon-line">{l || ' '}</span>)}
              </div>
              {backing === 'rect' && <div className="neon-backing" />}

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-4 py-3" style={{ background: 'linear-gradient(0deg,rgba(6,6,10,.85),transparent)' }}>
                <button
                  onClick={() => (on ? setOn(false) : powerOn())}
                  className={`neon-switch inline-flex items-center gap-2.5 text-[11px] uppercase tracking-[0.12em] text-slate-400 ${on ? 'is-on' : ''}`}
                >
                  <span className="neon-toggle" />
                  {on ? 'On' : 'Off'}
                </button>
                <div className="text-xs text-slate-400">
                  Approx. <b className="text-slate-100">{dimW}</b> × <b className="text-slate-100">{dimH}</b> cm
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Live preview of your LED neon flex sign on a laser-cut acrylic backboard. What you set here maps 1:1 to the
              production spec our workshop receives.
            </p>
          </div>

          {/* ---------- CONTROLS ---------- */}
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              {/* text */}
              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  <span>Your text</span>
                  <span className="font-normal normal-case tracking-normal text-slate-500">{cfg.maxChars - text.length} left</span>
                </div>
                <textarea
                  value={text}
                  maxLength={cfg.maxChars}
                  rows={2}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type your sign…"
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-lg text-white placeholder:text-slate-500 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                />
              </div>

              {/* font */}
              <div className="mb-6">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Font</div>
                <div className="grid grid-cols-3 gap-2">
                  {cfg.fonts.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setFont(f.key)}
                      className={`rounded-xl border px-2 py-3 text-center transition ${font === f.key ? 'border-pink-500 bg-pink-500/10' : 'border-white/10 bg-white/5 hover:border-white/25'}`}
                    >
                      <span className="block text-xl leading-none text-slate-100" style={{ fontFamily: f.cssFamily }}>Ag</span>
                      <span className="mt-1.5 block text-[10.5px] text-slate-400">{f.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* colour */}
              <div className="mb-6">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Colour</div>
                <div className="flex flex-wrap gap-3">
                  {cfg.colors.map((c) => (
                    <button
                      key={c.key}
                      title={c.name}
                      onClick={() => setColor(c.key)}
                      className={`h-9 w-9 rounded-full border-2 transition ${color === c.key ? 'scale-110 border-white' : 'border-transparent hover:scale-105'}`}
                    >
                      <span className="block h-full w-full rounded-full" style={{ background: c.glow, boxShadow: `0 0 10px ${c.glow}` }} />
                    </button>
                  ))}
                </div>
              </div>

              {/* size */}
              <div className="mb-6">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Size &amp; width</div>
                <div className="flex flex-wrap gap-2">
                  {cfg.sizes.map((s) => (
                    <button key={s.key} onClick={() => setSize(s.key)} className={pill(size === s.key)}>
                      {s.name}<span className="ml-1.5 text-xs text-slate-500">{s.cm}cm</span>
                      <span className="ml-1.5 text-xs text-pink-300">{formatPaise(s.basePricePaise)}+</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* backing + scene */}
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Backboard &amp; scene</div>
                <div className="mb-2.5 flex flex-wrap gap-2">
                  {cfg.backings.map((b) => (
                    <button key={b.key} onClick={() => setBacking(b.key)} className={pill(backing === b.key)}>
                      {b.name}{b.priceDeltaPaise > 0 && <span className="ml-1.5 text-xs text-pink-300">+{formatPaise(b.priceDeltaPaise)}</span>}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {cfg.scenes.map((s) => (
                    <button key={s.key} onClick={() => setScene(s.key)} className={pill(scene === s.key)}>{s.name}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* summary */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <Row label="Design" value={text || '—'} />
              <Row label="Colour & font" value={`${colorObj?.name || '—'} · ${fontObj?.name || '—'}`} />
              <Row label="Size" value={sizeObj ? `${sizeObj.name} — ${sizeObj.cm} cm wide` : '—'} />
              <Row label="Est. tube length" value={`≈ ${tubeMeters.toFixed(1)} m`} />
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-xs uppercase tracking-[0.14em] text-slate-400">Estimated total</span>
                <span className="font-display text-3xl font-bold text-white">{formatPaise(estPaise)}</span>
              </div>
              <p className="mt-1 text-[11.5px] text-slate-500">Final price confirmed at checkout · incl. taxes/shipping per store settings · crafted in 5–7 days.</p>
              {error && <div className="mt-3 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</div>}
            </div>
          </div>
        </div>
      </div>

      {/* sticky buy bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0c0c12]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5">
          <div>
            <div className="text-[11px] uppercase tracking-[0.1em] text-slate-400">Estimated total</div>
            <div className="font-display text-2xl font-bold text-white">{formatPaise(estPaise)}</div>
          </div>
          <button
            onClick={handleAdd}
            disabled={adding}
            className="max-w-sm flex-1 rounded-xl px-6 py-3.5 font-display text-sm font-bold text-[#150008] transition disabled:opacity-60"
            style={{ background: 'linear-gradient(90deg,#ff2d95,#ff5ea8)', boxShadow: '0 8px 26px -8px rgba(255,45,149,.6)' }}
          >
            {adding ? 'Adding…' : 'Add to cart'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-2.5 text-sm last:border-none">
      <span className="text-slate-400">{label}</span>
      <span className="max-w-[60%] truncate text-right font-medium text-slate-100">{value}</span>
    </div>
  );
}
