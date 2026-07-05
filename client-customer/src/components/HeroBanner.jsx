import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// Full-width hero carousel fed by admin-managed banners (Admin -> Banners,
// placement "home_hero"). Auto-rotates; arrows + dots for manual control.
export default function HeroBanner({ banners }) {
  const [idx, setIdx] = useState(0);
  const count = banners.length;

  useEffect(() => {
    if (count <= 1) return undefined;
    const t = setInterval(() => setIdx((i) => (i + 1) % count), 5000);
    return () => clearInterval(t);
  }, [count]);

  if (count === 0) return null;
  const go = (n) => setIdx(((n % count) + count) % count);
  const b = banners[idx];

  const Slide = (
    <div className="relative h-[280px] w-full overflow-hidden sm:h-[420px]">
      {b.imageUrl ? (
        <img src={b.imageUrl} alt={b.title || ''} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full bg-linear-to-br from-indigo-100 to-parchment" />
      )}
      <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/15 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-6 pb-10 sm:pb-14">
        {b.title && (
          <h2 className="max-w-xl font-display text-3xl font-medium text-white drop-shadow sm:text-4xl">
            {b.title}
          </h2>
        )}
        <Link
          to={b.link || '/products'}
          className="mt-5 inline-block rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-indigo-700"
        >
          Shop now
        </Link>
      </div>
    </div>
  );

  return (
    <section className="relative">
      {Slide}

      {count > 1 && (
        <>
          <button
            onClick={() => go(idx - 1)}
            aria-label="Previous"
            className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-gray-800 shadow hover:bg-white"
          >
            ‹
          </button>
          <button
            onClick={() => go(idx + 1)}
            aria-label="Next"
            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-gray-800 shadow hover:bg-white"
          >
            ›
          </button>
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-2 rounded-full transition-all ${i === idx ? 'w-6 bg-white' : 'w-2 bg-white/60'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
