import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategories, getProducts } from '../services/catalog';
import ProductGrid from '../components/ProductGrid';
import Seo from '../components/Seo';

const HOW_IT_WORKS = [
  ['1', 'Pick a design', 'Choose a name plate and open the live customizer.'],
  ['2', 'Make it yours', 'Set material, size, font, colour, icons and your text.'],
  ['3', 'We craft & ship', 'We produce your exact design and deliver it to your door.'],
];

const REVIEWS = [
  ['Aarti S.', 'The wooden plate looks stunning on our door. Exactly like the preview!'],
  ['Rahul M.', 'Loved the live editor — I could see my name in different fonts instantly.'],
  ['Priya K.', 'Premium quality and fast delivery. Highly recommend.'],
];

const FAQS = [
  ['How long does delivery take?', 'Custom plates are made to order and typically ship in 5–7 business days.'],
  ['Can I change my design after ordering?', 'Yes — there is a design review step before manufacturing where you approve the final artwork.'],
  ['What materials are available?', 'Wood, acrylic and brass, with more options added regularly.'],
];

function Section({ title, subtitle, children, cta }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        {cta}
      </div>
      {children}
    </section>
  );
}

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCategories(), getProducts({ sort: 'newest', limit: 8 })])
      .then(([cats, prods]) => {
        setCategories(cats);
        setRecent(prods.items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Seo description="Design your own custom name plate in a live editor — pick material, size, font, colour and icons. Crafted to order and delivered." path="/" />
      {/* Hero */}
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
            <Link to="/products" className="rounded-md bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700">
              Start designing
            </Link>
            <a href="#how" className="rounded-md border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50">
              How it works
            </a>
          </div>
        </div>
      </section>

      {/* Featured categories */}
      <Section title="Shop by category" cta={<Link to="/products" className="text-sm font-medium text-indigo-600 hover:underline">View all</Link>}>
        {categories.length === 0 ? (
          <p className="text-sm text-gray-400">Categories coming soon.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {categories.map((c) => (
              <Link
                key={c._id}
                to={`/products?category=${c.slug}`}
                className="group relative flex h-32 items-end overflow-hidden rounded-xl border border-gray-200 bg-white p-4"
              >
                {c.banner && (
                  <img src={c.banner} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70 transition group-hover:scale-105" />
                )}
                <span className="relative font-semibold text-gray-900">{c.name}</span>
              </Link>
            ))}
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

      {/* Instagram gallery (static placeholder) */}
      <Section title="From our Instagram" subtitle="@namecraft">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-linear-to-br from-indigo-100 to-slate-200" />
          ))}
        </div>
      </Section>

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
