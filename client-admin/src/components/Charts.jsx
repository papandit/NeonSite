// Tiny dependency-free SVG charts for the admin dashboard. No chart library —
// keeps the bundle lean and avoids any external asset. Values are plain numbers
// (money callers pass paise and format labels themselves via tooltips).

// Smooth-ish area + line chart over a series of { label, value }.
export function AreaChart({ data = [], height = 160, stroke = '#6366f1', fill = 'rgba(99,102,241,0.15)', formatValue = (v) => v }) {
  const W = 640;
  const H = height;
  const pad = { top: 12, right: 8, bottom: 22, left: 8 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const max = Math.max(1, ...data.map((d) => d.value));
  const n = data.length;

  if (n === 0) return <p className="py-10 text-center text-sm text-slate-400">No data in this window.</p>;

  const x = (i) => pad.left + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v) => pad.top + innerH - (v / max) * innerH;

  const linePts = data.map((d, i) => `${x(i)},${y(d.value)}`).join(' ');
  const areaPts = `${pad.left},${pad.top + innerH} ${linePts} ${pad.left + innerW},${pad.top + innerH}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" role="img">
      {/* baseline grid */}
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={pad.left} x2={pad.left + innerW} y1={pad.top + innerH * f} y2={pad.top + innerH * f} stroke="#e2e8f0" strokeWidth="1" />
      ))}
      <polygon points={areaPts} fill={fill} />
      <polyline points={linePts} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.value)} r="3" fill={stroke} />
          <title>{`${d.label}: ${formatValue(d.value)}`}</title>
        </g>
      ))}
      {/* x labels: first, middle, last to avoid crowding */}
      {[0, Math.floor((n - 1) / 2), n - 1].filter((v, i, a) => a.indexOf(v) === i).map((i) => (
        <text key={i} x={x(i)} y={H - 6} textAnchor="middle" className="fill-slate-400" fontSize="11">{data[i].label}</text>
      ))}
    </svg>
  );
}

// Donut chart over segments of { label, value, color }.
export function Donut({ segments = [], size = 168, thickness = 22 }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <g transform={`rotate(-90 ${cx} ${cx})`}>
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="#f1f5f9" strokeWidth={thickness} />
          {total > 0 && segments.map((s, i) => {
            const len = (s.value / total) * c;
            const el = (
              <circle
                key={i}
                cx={cx} cy={cx} r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={thickness}
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
              >
                <title>{`${s.label}: ${s.value}`}</title>
              </circle>
            );
            offset += len;
            return el;
          })}
        </g>
        <text x={cx} y={cx - 4} textAnchor="middle" className="fill-slate-900" fontSize="22" fontWeight="700">{total}</text>
        <text x={cx} y={cx + 14} textAnchor="middle" className="fill-slate-400" fontSize="11">orders</text>
      </svg>
      <ul className="space-y-1.5 text-sm">
        {segments.length === 0 && <li className="text-slate-400">No orders yet.</li>}
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            <span className="capitalize text-slate-600">{s.label}</span>
            <span className="ml-auto font-medium text-slate-800">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Horizontal bars over { label, value, sub? }.
export function BarList({ items = [], color = '#6366f1', formatValue = (v) => v }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (items.length === 0) return <p className="py-6 text-center text-sm text-slate-400">No data.</p>;
  return (
    <div className="space-y-3">
      {items.map((it) => (
        <div key={it.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="truncate pr-2 text-slate-700">{it.label}</span>
            <span className="shrink-0 font-medium text-slate-800">{formatValue(it.value)}{it.sub ? <span className="ml-1 text-xs text-slate-400">{it.sub}</span> : null}</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100">
            <div className="h-2.5 rounded-full" style={{ width: `${(it.value / max) * 100}%`, background: color }} />
          </div>
        </div>
      ))}
    </div>
  );
}
