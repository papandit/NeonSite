import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getCategories, getProducts, getRecommendedProducts, getBanners } from '../services/catalog';
import ProductGrid from '../components/ProductGrid';
import HeroBanner from '../components/HeroBanner';
import Reveal from '../components/Reveal';
import TrustMarquee from '../components/TrustMarquee';
import InstagramStrip from '../components/InstagramStrip';
import NameplateLivePreview from '../components/NameplateLivePreview';
import NeonStudioPreview from '../components/NeonStudioPreview';
import ReviewWall from '../components/ReviewWall';
import Seo from '../components/Seo';
import { useLiveCatalog } from '../hooks/useLiveCatalog';
import { useSiteSettings } from '../context/SiteSettings';

// Staggered entrance animation for card grids.
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const rise = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } } };

// Presentation-only accent gradients for the feature cards, applied by position.
const FEATURE_TINTS = [
  'from-amber-50 to-orange-50',
  'from-emerald-50 to-teal-50',
  'from-indigo-50 to-violet-50',
  'from-rose-50 to-pink-50',
];

// A "behind the craft" video showcase (heading, video, CTA). Admin-editable copy.
function VideoShowcase({ video, badge, reverse = false }) {
  if (!video?.url) return null;
  return (
    <section className={`px-4 py-16 ${reverse ? 'bg-linear-to-b from-white to-parchment' : 'bg-linear-to-b from-parchment to-white'}`}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="mx-auto max-w-5xl"
      >
        <div className="text-center">
          <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">{badge}</span>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">{video.heading}</h2>
          {video.subheading && <p className="mx-auto mt-2 max-w-2xl text-gray-500">{video.subheading}</p>}
        </div>
        <div className="mt-8 overflow-hidden rounded-3xl border border-gray-200 bg-black shadow-2xl ring-1 ring-black/5">
          <video src={video.url} className="aspect-video w-full object-cover" controls playsInline autoPlay muted loop preload="metadata" />
        </div>
        {video.ctaText && (
          <div className="mt-6 text-center">
            <Link to={video.ctaLink || '/'} className="inline-block rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-700">
              {video.ctaText}
            </Link>
          </div>
        )}
      </motion.div>
    </section>
  );
}

function Section({ title, subtitle, children, cta }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <Reveal>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          </div>
          {cta}
        </div>
        {children}
      </Reveal>
    </section>
  );
}

export default function HomePage() {
  const { settings } = useSiteSettings();
  const c = settings.content;
  const [categories, setCategories] = useState([]);
  const [recent, setRecent] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const catScroll = useRef(null);

  const load = useCallback(() => {
    Promise.all([
      getCategories(),
      getProducts({ sort: 'newest', limit: 8 }),
      getRecommendedProducts({ limit: 8 }),
      getBanners('home_hero'),
    ])
      .then(([cats, prods, recs, bans]) => {
        setCategories(cats);
        setRecent(prods.items);
        setRecommended(recs);
        setBanners(bans);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Scroll by ~one viewport; snap-mandatory guarantees we land on full circles.
  const scrollCats = (dir) => {
    const el = catScroll.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.86, behavior: 'smooth' });
  };

  // Fallback circle image: a real product photo from that category when the
  // admin hasn't uploaded a category banner.
  const catImage = useMemo(() => {
    const map = {};
    [...recent, ...recommended].forEach((p) => {
      const cid = String(p.category?._id || p.category || '');
      if (cid && !map[cid] && p.images?.[0]) map[cid] = p.images[0];
    });
    return map;
  }, [recent, recommended]);

  useEffect(() => { load(); }, [load]);
  // Live sync: refetch when the admin changes the catalog.
  useLiveCatalog(load);

  return (
    <div>
      <Seo description="Design your own custom name plate in a live editor — pick material, size, font, colour and icons. Crafted to order and delivered." path="/" />
      {/* Hero — admin-managed banner carousel if present, else the default hero */}
      {banners.length > 0 ? (
        <HeroBanner banners={banners} />
      ) : (
        <section className="bg-linear-to-br from-indigo-50 to-white">
          <div className="mx-auto max-w-6xl px-4 py-20 text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{c.hero.heading}</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">{c.hero.subheading}</p>
            <div className="mt-8 flex justify-center gap-3">
              <Link to="/products" className="rounded-full bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700">
                {c.hero.ctaText}
              </Link>
              <a href="#how" className="rounded-md border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50">
                How it works
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Scrolling promises — sits right under the hero, before the static
          feature cards, so it's the first thing after the banner. */}
      <TrustMarquee items={c.marquee} />

      {/* Features / trust strip — hidden for now; the scrolling promises
          ribbon above covers the same claims. Uncomment to restore; the
          admin "Trust features" fields are untouched.

      <section className="border-b border-gray-200 bg-linear-to-b from-[#fbfdfc] to-[#eaf1ec]">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {c.features.map((f, i) => (
            <Reveal key={`${f.title}-${i}`} delay={i * 0.06}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="group flex h-full items-start gap-4 rounded-2xl border border-gray-100 bg-white/80 p-5 shadow-sm ring-1 ring-black/2 backdrop-blur transition hover:border-indigo-100 hover:shadow-lg"
              >
                <motion.span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${FEATURE_TINTS[i % FEATURE_TINTS.length]} text-2xl shadow-inner`}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: i * 0.25 }}
                >
                  {f.icon}
                </motion.span>
                <div>
                  <div className="font-display text-base font-semibold text-gray-900">{f.title}</div>
                  <div className="mt-1 text-sm leading-snug text-gray-500">{f.desc}</div>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>
      */}

      {/* Featured categories — circular tiles */}
      <Section title="Shop by category" cta={<Link to="/products" className="text-sm font-medium text-indigo-600 hover:underline">View all</Link>}>
        {categories.length === 0 ? (
          <p className="text-sm text-gray-400">Categories coming soon.</p>
        ) : (
          <div className="relative">
            {/* Left / right scroll arrows */}
            <button
              onClick={() => scrollCats(-1)}
              aria-label="Scroll left"
              className="absolute left-0 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-xl text-gray-700 shadow-md hover:bg-gray-50 sm:flex"
            >
              ‹
            </button>
            <div
              ref={catScroll}
              className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-2 pb-3 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {categories.map((c) => {
                const img = c.banner || catImage[String(c._id)];
                return (
                  <Link
                    key={c._id}
                    to={`/products?category=${c.slug}`}
                    className="group flex shrink-0 basis-[70%] snap-start flex-col items-center gap-4 text-center sm:basis-[38%] md:basis-[28%] lg:basis-[calc((100%-7.5rem)/5.5)]"
                  >
                    <div className="aspect-square w-full overflow-hidden rounded-full bg-white shadow-md ring-4 ring-white transition duration-300 group-hover:-translate-y-1.5 group-hover:shadow-xl group-hover:ring-indigo-100">
                      {img ? (
                        <img src={img} alt={c.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-indigo-100 via-white to-amber-100 font-display text-6xl text-indigo-500">
                          {c.name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <span className="font-display text-base font-semibold text-gray-800 transition group-hover:text-indigo-600 sm:text-lg">
                      {c.name}
                    </span>
                  </Link>
                );
              })}
            </div>
            <button
              onClick={() => scrollCats(1)}
              aria-label="Scroll right"
              className="absolute right-0 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-xl text-gray-700 shadow-md hover:bg-gray-50 sm:flex"
            >
              ›
            </button>
          </div>
        )}
      </Section>

      {/* Recently added */}
      <Section title="Recently added" subtitle="Fresh designs from our catalog" cta={<Link to="/products" className="text-sm font-medium text-indigo-600 hover:underline">Browse all</Link>}>
        {loading ? (
          <p className="text-sm text-gray-400">Loading products…</p>
        ) : recent.length === 0 ? (
          <p className="text-sm text-gray-400">No products yet — add some in the admin panel.</p>
        ) : (
          <ProductGrid products={recent} />
        )}
      </Section>

      {/* More products for you (recommended) */}
      {recommended.length > 0 && (
        <Section title="More products for you" subtitle="Top-rated picks from our collection" cta={<Link to="/products?sort=rating" className="text-sm font-medium text-indigo-600 hover:underline">See more</Link>}>
          <ProductGrid products={recommended} />
        </Section>
      )}

      {/* Studio demos — placed after the product rows, so someone who has
          just browsed the catalogue is shown how to make their own. */}
      <NeonStudioPreview />
      <NameplateLivePreview />

      {/* How to create — videos (neon + name plate), admin-editable.
          Hidden for now; the live nameplate demo above covers the same ground.
          Uncomment to bring them back — the admin fields and the VideoShowcase
          component are untouched. */}
      {/* <VideoShowcase video={c.video} badge="Neon craft" /> */}
      {/* <VideoShowcase video={c.videoNameplate} badge="Name plate craft" reverse /> */}

      {/* Promo — light, modern, animated */}
      <section className="bg-linear-to-b from-white to-[#eff5f1] px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-indigo-100 bg-white p-10 shadow-xl sm:p-14"
        >
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-indigo-100 opacity-70 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-24 h-64 w-64 rounded-full bg-amber-100 opacity-70 blur-3xl" />
          <div className="relative text-center">
            <motion.span
              initial={{ opacity: 0, scale: 0.85 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.15 }}
              className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700"
            >
              ✨ Custom · Made to order
            </motion.span>
            <h2 className="mt-4 font-display text-3xl font-semibold text-gray-900 sm:text-4xl">{c.promo.heading}</h2>
            <p className="mx-auto mt-3 max-w-xl text-gray-600">{c.promo.subheading}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                <Link to="/nameplates" className="inline-block rounded-full bg-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700">{c.promo.ctaText}</Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                <Link to="/neon" className="inline-block rounded-full border border-gray-300 px-7 py-3 text-sm font-semibold text-gray-700 transition hover:border-indigo-300 hover:bg-indigo-50">Neon signs ✨</Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* How it works — modern step cards, staggered */}
      <section id="how" className="bg-linear-to-b from-[#eff5f1] to-[#fbfdfc]">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <Reveal><h2 className="text-center font-display text-3xl font-semibold text-gray-900">How it works</h2></Reveal>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="mt-10 grid gap-6 sm:grid-cols-3">
            {c.howItWorks.map((s, i) => (
              <motion.div key={`${s.step}-${i}`} variants={rise} whileHover={{ y: -6 }} className="rounded-2xl border border-gray-100 bg-white p-7 text-center shadow-sm transition hover:shadow-lg">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-indigo-700 text-lg font-bold text-white shadow-md shadow-indigo-600/25">{s.step}</div>
                <h3 className="mt-4 font-display text-lg font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Reviews — modern cards, staggered + hover */}
      <Section title="What customers say">
        {/* Same wall as the product and studio pages — an even three-up grid
            gave every card the tallest one's height, so short quotes sat in a
            box of dead space. */}
        <ReviewWall
          items={c.testimonials.map((t, i) => ({
            id: i,
            name: t.name,
            rating: Number(t.rating) || 5,
            text: t.quote,
            media: t.image ? [{ type: 'image', url: t.image }] : [],
            date: t.date || '',
            source: t.source || '',
          }))}
        />
      </Section>

      {/* Community reels — hides itself when no tiles are configured. */}
      <InstagramStrip data={c.instagram} />

      {/* Newsletter — light modern card */}
      <section className="bg-[#fbfdfc] px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-indigo-100 bg-linear-to-br from-indigo-50 to-white p-10 text-center shadow-sm"
        >
          <h2 className="font-display text-2xl font-semibold text-gray-900">{c.newsletter.heading}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">{c.newsletter.subheading}</p>
          {subscribed ? (
            <motion.p initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-6 inline-block rounded-full bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700">
              Thanks for subscribing! 🎉
            </motion.p>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setSubscribed(true); }} className="mx-auto mt-6 flex max-w-md gap-2">
              <input type="email" required placeholder="you@email.com" className="flex-1 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} type="submit" className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Subscribe</motion.button>
            </form>
          )}
        </motion.div>
      </section>

      {/* FAQ — smooth animated accordion */}
      <Section title="Frequently asked questions">
        <div className="mx-auto max-w-3xl space-y-3">
          {c.faqs.map((f, i) => {
            const open = openFaq === i;
            return (
              <motion.div key={`${f.q}-${i}`} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }} className={`overflow-hidden rounded-2xl border bg-white transition ${open ? 'border-indigo-200 shadow-md' : 'border-gray-200'}`}>
                <button onClick={() => setOpenFaq(open ? null : i)} className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left">
                  <span className="font-medium text-gray-900">{f.q}</span>
                  <motion.span animate={{ rotate: open ? 180 : 0 }} className="shrink-0 text-indigo-500">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }} className="overflow-hidden">
                      <p className="px-6 pb-4 text-sm leading-relaxed text-gray-600">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
