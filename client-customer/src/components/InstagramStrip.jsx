// "Join our community on Instagram" — a carousel of vertical reels on the home
// page. Five are on screen at a time and the arrows page through the rest, up
// to fifteen.
//
// A tile can be either of two things, and the admin only has to paste a link
// for the common case:
//
//   * an Instagram reel URL — embedded straight from Instagram, so the real
//     post plays in place, with its own controls. Instagram will not let an
//     embed autoplay, so these show a poster and play on click.
//   * an uploaded clip or photo — served from our own assets. A clip here
//     autoplays muted on loop, which an embed cannot do.
//
// Only tiles that actually have media render, so an admin who fills in six of
// the fifteen slots gets six tiles rather than six tiles and nine grey holes.
//
// Clips autoplay muted and looping — the browser blocks autoplay with sound
// anyway, and a wall of tiles that all start talking at once would be hostile.
// They're also only playing while on screen: a row of simultaneously decoding
// videos is the fastest way to make a page feel broken on a laptop, so an
// IntersectionObserver pauses whatever has scrolled away.

import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const MAX_TILES = 15;

// Instagram's embed endpoint takes the shortcode from a /reel/, /p/ or /tv/
// permalink. Anything else is treated as an ordinary outbound link.
const IG_PERMALINK = /instagram\.com\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i;
const igEmbedUrl = (link = '') => {
  const m = String(link).match(IG_PERMALINK);
  return m ? `https://www.instagram.com/reel/${m[1]}/embed/` : null;
};

function Tile({ item }) {
  const ref = useRef(null);
  const embed = !item.video && !item.image ? igEmbedUrl(item.link) : null;
  // Five across on desktop, stepping down on narrower screens. The basis is
  // computed from the gap so the fifth tile lands flush with the edge instead
  // of being clipped.
  const shellBase =
    'relative aspect-9/16 shrink-0 snap-start overflow-hidden rounded-xl bg-gray-100 '
    + 'basis-[72%] sm:basis-[calc(50%-6px)] md:basis-[calc(33.333%-8px)] lg:basis-[calc(20%-10px)]';
  // Asset URLs are /api/assets/<id> with no extension, so the file name can't
  // say what this is. The admin form has separate video and image slots
  // instead, which is unambiguous and needs no MIME sniffing.
  const isVideo = Boolean(item.video);
  const src = item.video || item.image;

  // Play only what's visible.
  useEffect(() => {
    const el = ref.current;
    if (!el || !isVideo) return undefined;
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.25 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [isVideo]);

  if (embed) {
    return (
      <div className={`${shellBase} border border-gray-200 bg-white`}>
        <iframe
          src={embed}
          title={item.caption || 'Instagram reel'}
          loading="lazy"
          // Instagram's embed handles its own playback controls; we only give
          // it the room and let it scroll internally if the caption is long.
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          scrolling="no"
          className="h-full w-full border-0"
        />
      </div>
    );
  }

  const inner = isVideo ? (
    <video
      ref={ref}
      src={src}
      poster={item.image || undefined}
      muted
      loop
      playsInline
      preload="metadata"
      className="h-full w-full object-cover"
    />
  ) : (
    <img src={src} alt={item.caption || ''} loading="lazy" className="h-full w-full object-cover" />
  );

  const body = (
    <>
      {inner}
      {item.caption && (
        <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-3 text-xs font-medium leading-snug text-white">
          {item.caption}
        </span>
      )}
      {isVideo && (
        <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/45 p-1.5 text-white backdrop-blur-sm">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
        </span>
      )}
    </>
  );

  const shell = shellBase;
  if (!item.link) return <div className={shell}>{body}</div>;

  // A reel lives on instagram.com, but a seeded tile can point at one of our
  // own pages — those should navigate in place, not spawn a tab.
  const external = /^https?:\/\//i.test(item.link);
  return external ? (
    <a href={item.link} target="_blank" rel="noopener noreferrer" className={`${shell} block transition hover:opacity-95`}>
      {body}
    </a>
  ) : (
    <Link to={item.link} className={`${shell} block transition hover:opacity-95`}>
      {body}
    </Link>
  );
}

export default function InstagramStrip({ data }) {
  const scrollerRef = useRef(null);
  // A tile with neither a clip nor a photo is a half-filled row in the
  // editor, not something to render as a grey hole.
  const items = (data?.items || [])
    .filter((i) => i?.video || i?.image || igEmbedUrl(i?.link))
    .slice(0, MAX_TILES);
  if (!items.length) return null;

  // Page by roughly one screenful, so a click advances the row rather than
  // nudging it a tile at a time.
  const nudge = (dir) => {
    const el = scrollerRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' });
  };

  return (
    <section className="bg-white px-4 py-14">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center font-display text-2xl font-medium sm:text-3xl">
          {data.heading || 'Join our community on Instagram'}
        </h2>
        {data.followers && (
          <p className="mt-2 text-center text-sm text-gray-500">
            {data.profileUrl ? (
              <a href={data.profileUrl} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 hover:underline">
                {data.followers}
              </a>
            ) : data.followers}
          </p>
        )}

        <div className="relative mt-8">
          {items.length > 5 && (
            <>
              <button
                type="button"
                onClick={() => nudge(-1)}
                aria-label="Previous reels"
                className="absolute -left-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-700 shadow-lg transition hover:bg-gray-50 sm:flex"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 6l-6 6 6 6" /></svg>
              </button>
              <button
                type="button"
                onClick={() => nudge(1)}
                aria-label="Next reels"
                className="absolute -right-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-700 shadow-lg transition hover:bg-gray-50 sm:flex"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
              </button>
            </>
          )}

          <div
            ref={scrollerRef}
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {items.map((item, i) => <Tile key={i} item={item} />)}
          </div>
        </div>

        {data.profileUrl && (
          <div className="mt-6 text-center">
            <a
              href={data.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-indigo-400 hover:text-indigo-700"
            >
              Follow us on Instagram
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
