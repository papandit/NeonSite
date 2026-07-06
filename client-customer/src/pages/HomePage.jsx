import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getCategories, getProducts, getRecommendedProducts, getBanners } from '../services/catalog';
import ProductGrid from '../components/ProductGrid';
import HeroBanner from '../components/HeroBanner';
import Reveal from '../components/Reveal';
import Seo from '../components/Seo';
import { useLiveCatalog } from '../hooks/useLiveCatalog';

const HOW_IT_WORKS = [
  ['1', 'Pick a design', 'Choose a name plate and open the live customizer.'],
  ['2', 'Make it yours', 'Set material, size, font, colour, icons and your text.'],
  ['3', 'We craft & ship', 'We produce your exact design and deliver it to your door.'],
];

const FEATURES = [
  ['✍️', 'Made to order', 'Every plate is handcrafted just for you.'],
  ['🚚', 'Free shipping over ₹2000', 'Fast, tracked delivery across India.'],
  ['🎨', 'Live design preview', 'See exactly what you get before you buy.'],
  ['🔒', 'Secure checkout', 'Razorpay-protected payments, always.'],
];

const REVIEWS = [
  ['Aarti S.', 'The wooden plate looks stunning on our door. Exactly like the preview!'],
  ['Rahul M.', 'Loved the live editor — I could see my name in different fonts instantly.'],
  ['Priya K.', 'Premium quality and fast delivery. Highly recommend.'],
  ['Imran Q.', 'Ordered a brass plate for our office cabin — looks so professional.'],
  ['Sneha D.', 'The resin ocean design is gorgeous. Everyone asks where I got it.'],
  ['Vikram N.', 'Simple to customise and the finish is top-notch. Will order again.'],
];

const FAQS = [
  ['How long does delivery take?', 'Custom plates are made to order and typically ship in 5–7 business days.'],
  ['Can I change my design after ordering?', 'Yes — there is a design review step before manufacturing where you approve the final artwork.'],
  ['What materials are available?', 'Wood, acrylic, brass, steel and resin, with new options added regularly.'],
  ['How do I customize my name plate?', 'Open any product and use the live editor to set material, size, font, colour, border, background, mount and icons — the price updates instantly.'],
  ['Can I buy a plate without customizing?', 'Yes. Every product has an "Add to cart (as-is)" option that uses sensible defaults, or you can personalize it fully.'],
  ['Do you offer bulk or corporate orders?', 'Absolutely — reach out via the support email for office and bulk pricing.'],
  ['Do you ship across India?', 'Yes, we deliver pan-India with tracking. Shipping is free on orders over ₹2000.'],
  ['What is your return policy?', 'Because each plate is personalised, we replace items only for manufacturing defects or shipping damage.'],
];

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
  const [categories, setCategories] = useState([]);
  const [recent, setRecent] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
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
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Custom name plates, <span className="text-indigo-600">designed by you</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              Personalize material, size, font, colour and icons in a live editor — then we craft
              your exact design and deliver it.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link to="/products" className="rounded-full bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700">
                Start designing
              </Link>
              <a href="#how" className="rounded-md border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50">
                How it works
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Features / trust strip */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 sm:grid-cols-4">
          {FEATURES.map(([icon, title, desc], i) => (
            <Reveal key={title} delay={i * 0.06}>
              <div className="flex items-start gap-3">
                <motion.span
                  className="text-2xl"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: i * 0.25 }}
                >
                  {icon}
                </motion.span>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{title}</div>
                  <div className="text-xs text-gray-500">{desc}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

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
              {categories.map((c) => (
                <Link
                  key={c._id}
                  to={`/products?category=${c.slug}`}
                  className="group flex w-40 shrink-0 snap-start flex-col items-center gap-4 text-center sm:w-48"
                >
                  <div className="h-40 w-40 overflow-hidden rounded-full border border-gray-200 bg-white shadow-sm ring-1 ring-transparent transition group-hover:shadow-lg group-hover:ring-indigo-200 sm:h-48 sm:w-48">
                    {c.banner ? (
                      <img src={c.banner} alt={c.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-indigo-50 font-display text-6xl text-indigo-600">
                        {c.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className="font-display text-lg font-medium text-gray-800 transition group-hover:text-indigo-600">
                    {c.name}
                  </span>
                </Link>
              ))}
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

      {/* Promo band */}
      <section className="overflow-hidden bg-linear-to-br from-indigo-600 to-indigo-500">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center text-white">
          <Reveal>
            <h2 className="font-display text-3xl font-medium text-white sm:text-4xl">Ready to design yours?</h2>
            <p className="mx-auto mt-3 max-w-xl text-indigo-50">
              Create a one-of-a-kind name plate in minutes — or grab a ready design as-is.
            </p>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="mt-6 inline-block">
              <Link to="/products" className="inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow-lg hover:bg-indigo-50">
                Start designing
              </Link>
            </motion.div>
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-center text-2xl font-bold">How it works</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {HOW_IT_WORKS.map(([n, title, desc]) => (
              <div key={n} className="rounded-xl border border-gray-200 bg-white p-6 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 font-bold text-white">{n}</div>
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <Section title="What customers say">
        <div className="grid gap-4 sm:grid-cols-3">
          {REVIEWS.map(([name, quote]) => (
            <figure key={name} className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="text-amber-400">★★★★★</div>
              <blockquote className="mt-2 text-sm text-gray-700">“{quote}”</blockquote>
              <figcaption className="mt-3 text-xs font-medium text-gray-500">{name}</figcaption>
            </figure>
          ))}
        </div>
      </Section>

      {/* Newsletter */}
      <section className="bg-white">
        <div className="mx-auto max-w-2xl px-4 py-14 text-center">
          <h2 className="font-display text-2xl font-medium text-gray-900">Join our list</h2>
          <p className="mt-2 text-sm text-gray-500">Design ideas, new materials and offers — straight to your inbox.</p>
          {subscribed ? (
            <p className="mt-6 rounded-full bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700">
              Thanks for subscribing! 🎉
            </p>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setSubscribed(true); }} className="mx-auto mt-6 flex max-w-md gap-2">
              <input type="email" required placeholder="you@email.com" className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              <button type="submit" className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Subscribe</button>
            </form>
          )}
        </div>
      </section>

      {/* FAQ */}
      <Section title="Frequently asked questions">
        <div className="mx-auto max-w-3xl divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
          {FAQS.map(([q, a]) => (
            <details key={q} className="group px-6 py-4">
              <summary className="cursor-pointer list-none font-medium text-gray-900">{q}</summary>
              <p className="mt-2 text-sm text-gray-600">{a}</p>
            </details>
          ))}
        </div>
      </Section>
    </div>
  );
}
