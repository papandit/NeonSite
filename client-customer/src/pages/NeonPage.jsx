// Neon Sign Studio — a live LED-neon customizer. Text / font / colour / size /
// backing / adapter / scene, with a glowing preview, day-night lighting, On/Off
// power, and measured width×height dimension guides that track the actual text.
// The client shows a live ESTIMATE; the server reprices on add-to-cart and again
// at checkout (INVARIANT 2). Neon signs buy through the normal cart → checkout.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getNeonConfig } from '../services/neon';
import { API_BASE_URL } from '../services/api';
import { ensureGoogleFont } from '../lib/loadFont';
import { addNeonToCart } from '../store/cartSlice';
import { selectIsAuthenticated } from '../store/authSlice';
import { formatPaise } from '../utils/money';
import { apiErrorMessage } from '../services/api';
import Seo from '../components/Seo';
import NeonInfoSections from '../components/NeonInfoSections';
import { useSiteSettings } from '../context/SiteSettings';
import './neon.css';
import Breadcrumbs from '../components/Breadcrumbs';

export const PENDING_NEON_KEY = 'nc_pending_neon';

const charCountOf = (t) => (t || '').replace(/\s/g, '').length;

// ---- trust badges + delivery timeline icons ----
const ic = 'h-6 w-6';
const ShieldIcon = () => (
  <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v6c0 4.4-3 8-7 9-4-1-7-4.6-7-9V6z" /><path d="M9 12l2 2 4-4" /></svg>
);
const BadgeIcon = () => (
  <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8" /><path d="M9 12l2 2 4-4" /></svg>
);
const SparkleIcon = () => (
  <svg className={ic} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 5.6L19.5 9l-5.6 1.9L12 16.5l-1.9-5.6L4.5 9l5.6-1.4z" /><path d="M18.5 14l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z" opacity=".7" /></svg>
);
const TruckIcon = () => (
  <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.6" /><circle cx="17.5" cy="18" r="1.6" /></svg>
);
const CartIcon = () => (
  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4h2l2.2 10.4a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.55L20 8H6" /><circle cx="10" cy="19" r="1.4" /><circle cx="17" cy="19" r="1.4" /></svg>
);
const BagIcon = () => (
  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 7h14l-1 13H6z" /><path d="M9 7a3 3 0 0 1 6 0" /><path d="M9.5 13l2 2 3.5-3.5" /></svg>
);
const BoxIcon = () => (
  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8l9-4 9 4-9 4z" /><path d="M3 8v8l9 4 9-4V8" /><path d="M12 12v8" /></svg>
);

const TRUST = [
  { label: '2 year warranty', icon: <ShieldIcon /> },
  { label: 'Top-notch quality', icon: <BadgeIcon /> },
  { label: 'Flawless finishing', icon: <SparkleIcon /> },
  { label: 'Free shipping', icon: <TruckIcon /> },
];

// Order today -> ready in 2-4 days -> delivered 10-12 days out.
const fmtDate = (d) => d.toLocaleDateString('en-IN', { month: 'short', day: '2-digit' });
function deliveryWindow() {
  const day = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };
  return {
    today: fmtDate(day(0)),
    ready: `${fmtDate(day(2))} – ${fmtDate(day(4))}`,
    delivery: `${fmtDate(day(10))} – ${fmtDate(day(12))}`,
  };
}


function SunIcon() {
  return (
    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
  );
}

export default function NeonPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthed = useSelector(selectIsAuthenticated);
  const { settings } = useSiteSettings();
  const shipDates = useMemo(() => deliveryWindow(), []);
  const [lightType, setLightType] = useState('neon'); // 'neon' | 'floro'
  const infoBlock = lightType === 'floro' ? settings.content?.floroInfo : settings.content?.neonInfo;

  const [cfg, setCfg] = useState(null);
  const [text, setText] = useState('good vibes only');
  const [font, setFont] = useState('');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [backing, setBacking] = useState('');
  const [adapter, setAdapter] = useState('');
  const [scene, setScene] = useState('');
  const [on, setOn] = useState(true);
  const [mode, setMode] = useState('night'); // night | day
  const [powering, setPowering] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);

  const signRef = useRef(null);
  const stageRef = useRef(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [stageBox, setStageBox] = useState({ w: 0, h: 0 });

  const load = useCallback(() => {
    getNeonConfig().then((c) => {
      setCfg(c);
      // Load every offered font so custom / catalogue fonts render on the sign.
      (c.fonts || []).forEach((f) => { const fam = f.cssFamily?.match(/'([^']+)'/)?.[1] || f.name; ensureGoogleFont(fam); });
      setFont((f) => f || c.fonts[0]?.key || '');
      setColor((v) => v || c.colors[0]?.key || '');
      setSize((v) => v || c.sizes.find((s) => s.key === 'm')?.key || c.sizes[0]?.key || '');
      setBacking((v) => v || c.backings[0]?.key || '');
      setAdapter((v) => v || c.adapters?.[0]?.key || '');
      setScene((v) => v || c.scenes[0]?.key || '');
    }).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  // Live refresh when the admin edits the neon catalogue.
  useEffect(() => {
    const base = API_BASE_URL.replace(/\/$/, '');
    const es = new EventSource(`${base}/events`);
    es.addEventListener('neon:changed', load);
    es.onerror = () => {};
    return () => es.close();
  }, [load]);

  // Measure the sign + stage (contentRect = layout size, unaffected by the
  // fit-scale transform, so no feedback loop) to drive the dimension guides and
  // auto-fit the sign so big/long text is never clipped.
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const sign = signRef.current;
    const stage = stageRef.current;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const cr = e.contentRect;
        if (e.target === sign) setBox({ w: cr.width, h: cr.height });
        else if (e.target === stage) setStageBox({ w: cr.width, h: cr.height });
      }
    });
    if (sign) ro.observe(sign);
    if (stage) ro.observe(stage);
    return () => ro.disconnect();
  }, [cfg]);

  // Scale the sign down to fit within the stage (never up past 1).
  const fitScale = (box.w > 0 && box.h > 0 && stageBox.w > 0)
    ? Math.min(1, (stageBox.w * 0.8) / box.w, (stageBox.h * 0.6) / box.h)
    : 1;

  const fontObj = useMemo(() => cfg?.fonts.find((f) => f.key === font), [cfg, font]);
  const colorObj = useMemo(() => cfg?.colors.find((c) => c.key === color), [cfg, color]);
  const sizeObj = useMemo(() => cfg?.sizes.find((s) => s.key === size), [cfg, size]);
  const backObj = useMemo(() => cfg?.backings.find((b) => b.key === backing), [cfg, backing]);
  const adapterObj = useMemo(() => cfg?.adapters?.find((a) => a.key === adapter), [cfg, adapter]);
  const sceneObj = useMemo(() => cfg?.scenes.find((s) => s.key === scene), [cfg, scene]);

  const charCount = charCountOf(text);
  const estPaise = sizeObj
    ? sizeObj.basePricePaise + charCount * sizeObj.perCharPaise + (backObj?.priceDeltaPaise || 0) + (adapterObj?.priceDeltaPaise || 0)
    : 0;

  const tubeMeters = sizeObj ? charCount * (sizeObj.cm / 60) * 0.22 * (fontObj?.script ? 1.25 : 1) : 0;

  // Real-world dimensions come straight from the selected size (height × length),
  // so the preview matches the size chip exactly. If the admin set a per-character
  // width, the length grows with the text instead.
  const sizeUnit = sizeObj?.unit || 'cm';
  const lines = (text || ' ').split('\n');
  const lineCm = sizeObj ? (sizeObj.heightCm > 0 ? sizeObj.heightCm : Math.max(1, Math.round(sizeObj.fontSizePx * 0.33))) : 15;
  const heightCm = lineCm * lines.length;
  const longestLineChars = Math.max(1, ...lines.map((l) => l.replace(/\s/g, '').length));
  const widthCm = sizeObj
    ? (sizeObj.perCharCm > 0 ? Math.max(1, Math.round(longestLineChars * sizeObj.perCharCm)) : sizeObj.cm)
    : 30;

  const powerOn = () => {
    setOn(true);
    setPowering(true);
    setTimeout(() => setPowering(false), 750);
  };

  const handleAdd = async () => {
    if (!sizeObj || !text.trim()) { setError('Add some text and pick a size first.'); return; }
    setAdding(true);
    setError(null);
    const spec = { text, font, color, size, backing, adapter, scene };
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
      active ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/25 hover:text-white'
    }`;
  const modeBtn = (active) =>
    `flex h-8 w-9 items-center justify-center rounded-md transition ${active ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`;
  const powerBtn = (active) =>
    `rounded-md px-3.5 py-1.5 text-sm font-semibold transition ${active ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`;

  return (
    <div className="bg-[#0a0a0f] text-slate-100" style={{
      backgroundImage:
        'radial-gradient(1200px 700px at 80% -10%, rgba(233,148,107,.05), transparent 60%), radial-gradient(900px 600px at 0% 110%, rgba(212,84,31,.06), transparent 55%)',
    }}>
      <Seo title="Neon Sign Studio" description="Design your own LED neon sign — text, font, colour, size — with a live glowing preview and instant pricing." path="/neon" />

      <div className="mx-auto max-w-6xl px-4 pb-14 pt-10">
        <Breadcrumbs dark items={[{ label: 'Neon Studio' }]} />
        <header className="mb-8 text-center">
          <h1 className="font-display text-4xl font-semibold" style={{ color: '#e4fff2', textShadow: '0 0 6px #00af99,0 0 16px #00af99,0 0 34px #00af99' }}>
            Neon Sign Studio
          </h1>
          <p className="mt-2 text-sm text-slate-400">Design a custom LED neon sign — live preview, size-based pricing, crafted to order.</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr] lg:items-start">
          {/* ---------- STAGE ---------- */}
          <div className="lg:sticky lg:top-24">
            <div
              ref={stageRef}
              className={`neon-stage ${scene || 'wall'}`}
              style={sceneObj?.imageUrl ? {
                backgroundImage: `linear-gradient(rgba(4,4,8,${mode === 'day' ? 0.15 : 0.5}), rgba(4,4,8,${mode === 'day' ? 0.15 : 0.55})), url("${sceneObj.imageUrl}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              } : undefined}
            >
              {backing === 'rect' && <div className="neon-backing" />}
              {mode === 'day' && !sceneObj?.imageUrl && <div className="neon-day-veil" />}

              {/* top controls: day/night + power */}
              <div className="absolute left-3 top-3 z-10 flex items-center gap-3">
                <div className="flex items-center gap-1.5 rounded-lg bg-black/30 p-1 backdrop-blur">
                  <button onClick={() => setMode('day')} title="Daytime" className={modeBtn(mode === 'day')}><SunIcon /></button>
                  <button onClick={() => setMode('night')} title="Night" className={modeBtn(mode === 'night')}><MoonIcon /></button>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-black/30 p-1 backdrop-blur">
                  <button onClick={powerOn} className={powerBtn(on)}>On</button>
                  <button onClick={() => setOn(false)} className={powerBtn(!on)}>Off</button>
                </div>
              </div>

              {/* the sign + measured dimension guides (auto-fit to the stage) */}
              <div className="neon-measure" style={{ transform: `scale(${fitScale})`, transition: 'transform 0.2s ease' }}>
                <div
                  ref={signRef}
                  className={`neon-sign ${on ? 'on' : 'off'} ${mode === 'day' ? 'day' : ''} ${powering ? 'powering' : ''}`}
                  style={{
                    fontFamily: fontObj?.cssFamily || 'cursive',
                    fontSize: `clamp(22px, 8vw, ${sizeObj?.fontSizePx || 46}px)`,
                    '--neon-fill': colorObj?.fill || '#fff',
                    '--neon-glow': colorObj?.glow || '#00af99',
                  }}
                >
                  {lines.map((l, i) => <span key={i} className="neon-line">{l || ' '}</span>)}
                </div>
                <div className="neon-dim-y"><span>{heightCm} {sizeUnit}</span></div>
                <div className="neon-dim-x"><span>{widthCm} {sizeUnit}</span></div>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Live preview on a laser-cut acrylic backboard. The dimensions match your selected size; toggle day/night and power
              to see how it reads in a real room.
            </p>

            {/* Background scene — sits under the preview so you see the room change live */}
            {cfg.scenes.length > 0 && (
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Background scene</div>
                <div className="flex flex-wrap gap-2">
                  {cfg.scenes.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setScene(s.key)}
                      className={`flex flex-col overflow-hidden rounded-xl border transition ${scene === s.key ? 'border-indigo-500' : 'border-white/10 hover:border-white/25'}`}
                    >
                      {s.imageUrl ? (
                        <img src={s.imageUrl} alt={s.name} className="h-12 w-20 object-cover" />
                      ) : (
                        <span className={`neon-thumb ${s.key}`} />
                      )}
                      <span className="px-2 py-1 text-[11px] text-slate-300">{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
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
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-lg text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* font */}
              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  <span>Font style</span>
                  <span className="font-normal normal-case tracking-normal text-slate-500">{cfg.fonts.length} styles</span>
                </div>
                <div className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
                  {cfg.fonts.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setFont(f.key)}
                      className={`rounded-xl border px-2 py-3 text-center transition ${font === f.key ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 bg-white/5 hover:border-white/25'}`}
                    >
                      <span className="block truncate text-xl leading-none text-slate-100" style={{ fontFamily: f.cssFamily }}>Ag</span>
                      <span className="mt-1.5 block truncate text-[10.5px] text-slate-400">{f.name}</span>
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
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Select size</div>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {cfg.sizes.map((s) => {
                    const h = s.heightCm > 0 ? s.heightCm : Math.max(1, Math.round((s.fontSizePx || 46) * 0.33));
                    const u = s.unit || 'cm';
                    const on = size === s.key;
                    return (
                      <button
                        key={s.key}
                        onClick={() => setSize(s.key)}
                        className={`overflow-hidden rounded-lg border text-center transition ${on ? 'border-indigo-500 ring-1 ring-indigo-500/40' : 'border-white/15 hover:border-white/35'}`}
                      >
                        <span className={`block px-2 py-1.5 text-sm font-semibold ${on ? 'bg-indigo-500 text-white' : 'bg-white/8 text-slate-200'}`}>
                          {s.name}
                        </span>
                        <span className="block border-t border-white/10 px-2 py-1 text-xs text-slate-300">Height: {h}{u}</span>
                        <span className="block border-t border-white/10 px-2 py-1 text-xs text-slate-300">Width: {s.cm}{u}</span>
                        <span className="block border-t border-white/10 px-2 py-1 text-[11px] font-medium text-indigo-300">{formatPaise(s.basePricePaise)}+</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* backing — hidden on the storefront. The first active backing is
                  still applied and priced by the server; un-comment to offer the
                  choice again.
              <div className="mb-6">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Backboard</div>
                <div className="flex flex-wrap gap-2">
                  {cfg.backings.map((b) => (
                    <button key={b.key} onClick={() => setBacking(b.key)} className={pill(backing === b.key)}>
                      {b.name}{b.priceDeltaPaise > 0 && <span className="ml-1.5 text-xs text-indigo-300">+{formatPaise(b.priceDeltaPaise)}</span>}
                    </button>
                  ))}
                </div>
              </div>
              */}

              {/* power adapter */}
              {cfg.adapters?.length > 0 && (
                <div className="mb-6">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Power adapter</div>
                  <div className="flex flex-wrap gap-2">
                    {cfg.adapters.map((a) => (
                      <button key={a.key} onClick={() => setAdapter(a.key)} className={pill(adapter === a.key)}>
                        {a.name}{a.priceDeltaPaise > 0 && <span className="ml-1.5 text-xs text-indigo-300">+{formatPaise(a.priceDeltaPaise)}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* summary */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <Row label="Design" value={text || '—'} />
              <Row label="Colour & font" value={`${colorObj?.name || '—'} · ${fontObj?.name || '—'}`} />
              <Row label="Dimensions" value={`${heightCm} × ${widthCm} ${sizeUnit}`} />
              <Row label="Power adapter" value={adapterObj?.name || '—'} />
              <Row label="Est. tube length" value={`≈ ${tubeMeters.toFixed(1)} m`} />
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-xs uppercase tracking-[0.14em] text-slate-400">Estimated total</span>
                <span className="font-display text-3xl font-bold text-white">{formatPaise(estPaise)}</span>
              </div>
              <p className="mt-1 text-[11.5px] text-slate-500">Final price confirmed at checkout · incl. taxes/shipping per store settings.</p>
              {error && <div className="mt-3 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</div>}

              <button
                onClick={handleAdd}
                disabled={adding}
                className="mt-4 w-full rounded-xl px-6 py-3.5 font-display text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-60"
                style={{ background: 'linear-gradient(90deg,#00af99,#6fae93)', boxShadow: '0 8px 26px -8px rgba(0,175,153,.55)' }}
              >
                {adding ? 'Adding…' : `Add to cart · ${formatPaise(estPaise)}`}
              </button>

              {/* trust badges */}
              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-4 sm:grid-cols-4">
                {TRUST.map((t) => (
                  <div key={t.label} className="flex flex-col items-center gap-1.5 text-center">
                    <span className="text-emerald-400">{t.icon}</span>
                    <span className="text-[11px] font-medium leading-tight text-slate-300">{t.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* delivery timeline */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-center text-sm font-semibold text-white">Free shipping</div>
              <div className="mt-4 flex items-start justify-between gap-2">
                {[
                  { icon: <CartIcon />, title: 'Order today', when: shipDates.today },
                  { icon: <BagIcon />, title: 'Order ready', when: shipDates.ready },
                  { icon: <BoxIcon />, title: 'Estimated delivery', when: shipDates.delivery },
                ].map((st, i) => (
                  <div key={st.title} className="relative flex flex-1 flex-col items-center text-center">
                    {i > 0 && <span className="absolute -left-1/2 top-4 -z-0 hidden h-px w-full border-t border-dashed border-emerald-500/40 sm:block" />}
                    <span className="relative z-10 text-emerald-400">{st.icon}</span>
                    <span className="mt-2 text-[11.5px] font-semibold text-slate-200">{st.title}</span>
                    <span className="text-[11px] text-slate-400">{st.when}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 rounded-lg bg-white/5 px-3 py-2 text-center text-[11.5px] text-slate-400">
                Need it sooner? Ask us about express production.
              </p>
            </div>
          </div>
        </div>
      </div>


      {/* Product story: about / box / install / reviews / FAQs (admin-editable) */}
      <NeonInfoSections
        lightType={lightType}
        onLightType={setLightType}
        info={infoBlock}
        compare={infoBlock?.compare || settings.content?.compare}
        crafted={settings.content?.crafted}
        assurance={settings.content?.assurance}
      />
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
