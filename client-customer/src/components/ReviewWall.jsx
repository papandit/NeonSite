// The review wall — a Google-reviews style masonry of cards, used everywhere
// reviews appear (product pages, the neon studio, FloRo) so the site shows one
// consistent shape rather than a different list per page.
//
// Masonry via CSS `columns` rather than a grid: cards here are wildly uneven
// (a one-liner next to a six-paragraph story with four photos), and columns
// pack them tightly with no JS measuring and no layout thrash on resize.
// `break-inside-avoid` is what stops a card being split across a column.
//
// Feed it `items` of { id, name, rating, text, media, date, mine } — the
// callers normalise their own shapes into that.

import { motion } from 'framer-motion';

// A stable colour per person, so the same reviewer keeps the same chip
// everywhere. Hashing the name beats random: it survives a re-render and a
// reload, and two people with different names rarely collide.
const AVATAR_TINTS = [
  'bg-emerald-500', 'bg-indigo-500', 'bg-amber-500', 'bg-rose-500',
  'bg-sky-500', 'bg-violet-500', 'bg-teal-500', 'bg-orange-500',
];
function tintFor(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) % 997;
  return AVATAR_TINTS[h % AVATAR_TINTS.length];
}

function Stars({ value = 5, dark }) {
  const full = Math.round(value);
  return (
    <div className="flex gap-0.5" aria-label={`${full} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= full ? 'text-amber-400' : dark ? 'text-white/15' : 'text-gray-300'}>★</span>
      ))}
    </div>
  );
}

function Card({ item, dark, index, onRemove, removing }) {
  const { name, rating = 5, text, media = [], date, mine } = item;
  return (
    <motion.figure
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.4, delay: Math.min(index, 6) * 0.05, ease: 'easeOut' }}
      className={`mb-4 break-inside-avoid rounded-xl border p-4 ${
        dark ? 'border-white/10 bg-white/[0.03]' : 'border-gray-200 bg-white'
      }`}
    >
      <Stars value={rating} dark={dark} />

      {text && (
        <blockquote className={`mt-2.5 whitespace-pre-line text-sm leading-relaxed ${dark ? 'text-slate-300' : 'text-gray-700'}`}>
          {text}
        </blockquote>
      )}

      {media.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {media.map((m, i) => (m.type === 'video' ? (
            <video
              key={i}
              src={m.url}
              controls
              preload="metadata"
              className="h-20 w-28 rounded-lg border border-black/10 bg-black object-cover"
            />
          ) : (
            <a key={i} href={m.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
              <img
                src={m.url}
                alt=""
                loading="lazy"
                className="h-20 w-20 rounded-lg border border-black/10 object-cover transition hover:opacity-90"
              />
            </a>
          )))}
        </div>
      )}

      <figcaption className="mt-3.5 flex items-center gap-2.5">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${tintFor(name)}`}>
          {(name || 'C').charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block truncate text-[13px] font-semibold ${dark ? 'text-slate-200' : 'text-gray-900'}`}>
            {name || 'Customer'}
            {mine && <span className="ml-1.5 rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">You</span>}
          </span>
          {date && <span className={`block text-[11px] ${dark ? 'text-slate-500' : 'text-gray-400'}`}>{date}</span>}
        </span>
        {mine && onRemove && (
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            disabled={removing}
            className="shrink-0 text-[11px] font-medium text-red-600 transition hover:underline disabled:opacity-50"
          >
            {removing ? 'Removing…' : 'Remove'}
          </button>
        )}
      </figcaption>
    </motion.figure>
  );
}

export default function ReviewWall({ items = [], dark = false, onRemove, removingId }) {
  if (!items.length) return null;
  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
      {items.map((item, i) => (
        <Card
          key={item.id ?? i}
          item={item}
          dark={dark}
          index={i}
          onRemove={onRemove}
          removing={removingId === item.id}
        />
      ))}
    </div>
  );
}
