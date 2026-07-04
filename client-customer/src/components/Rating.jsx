// Simple 5-star rating display (read-only).
export default function Rating({ value = 0, size = 'text-sm', showValue = false }) {
  const full = Math.round(value);
  return (
    <span className={`inline-flex items-center gap-0.5 ${size}`} aria-label={`Rated ${value} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= full ? 'text-amber-400' : 'text-slate-300'}>
          ★
        </span>
      ))}
      {showValue && <span className="ml-1 text-xs text-slate-500">{value.toFixed(1)}</span>}
    </span>
  );
}
