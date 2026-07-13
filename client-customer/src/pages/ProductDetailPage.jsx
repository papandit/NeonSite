import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { getProductBySlug, getRelatedProducts, getRecommendedProducts } from '../services/catalog';
import { formatPaise } from '../utils/money';
import { quickAddToCart } from '../store/cartSlice';
import { selectIsAuthenticated } from '../store/authSlice';
import Rating from '../components/Rating';
import ProductGrid from '../components/ProductGrid';
import Reviews from '../components/Reviews';
import Seo from '../components/Seo';

// Split an admin multiline field into trimmed, non-empty lines.
const toLines = (s) => (s || '').split('\n').map((x) => x.trim()).filter(Boolean);

// A collapsible detail section (matches the product-page accordions).
function Accordion({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-gray-200">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between py-4 text-left">
        <span className="text-lg font-semibold text-gray-900">{title}</span>
        <svg className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="pb-5 text-sm text-gray-600">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthed = useSelector(selectIsAuthenticated);
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [addState, setAddState] = useState('idle');

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setActiveImage(0);
    getProductBySlug(slug)
      .then((p) => { setProduct(p); setSelectedColor(p.colors?.[0] || null); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
    getRelatedProducts(slug).then(setRelated).catch(() => setRelated([]));
    getRecommendedProducts({ exclude: slug, limit: 4 }).then(setRecommended).catch(() => setRecommended([]));
  }, [slug]);

  const handleAdd = async () => {
    if (!isAuthed) {
      navigate('/login', { state: { from: { pathname: `/products/${slug}` } } });
      return;
    }
    setAddState('adding');
    try {
      await dispatch(quickAddToCart({ productId: product._id, quantity: qty, color: selectedColor })).unwrap();
      navigate('/cart');
    } catch {
      setAddState('idle');
    }
  };

  if (loading) return <div className="mx-auto max-w-6xl px-4 py-20 text-center text-gray-400">Loading…</div>;

  if (notFound || !product) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-xl font-semibold">Product not found</h1>
        <Link to="/products" className="mt-4 inline-block rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          Browse products
        </Link>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Seo
        title={product.name}
        description={product.description || `Design a custom ${product.name} — material, size, font, colour and icons.`}
        image={product.images?.[0]}
        path={`/products/${product.slug}`}
      />
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500">
        <Link to="/" className="hover:text-gray-900">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/products" className="hover:text-gray-900">Products</Link>
        {product.category?.name && (
          <>
            <span className="mx-2">/</span>
            <Link to={`/products?category=${product.category.slug}`} className="hover:text-gray-900">{product.category.name}</Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      {/* Intro: gallery + info */}
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex gap-3">
          {/* Left vertical thumbnail strip */}
          {images.length > 1 && (
            <div className="flex max-h-130 flex-col gap-2 overflow-y-auto pr-0.5">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImage(i)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border transition ${i === activeImage ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-indigo-300'}`}>
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          {/* Main image */}
          <div className="aspect-square flex-1 overflow-hidden rounded-xl border border-gray-200 bg-slate-50">
            {images[activeImage] ? (
              <img src={images[activeImage]} alt={product.name} className="h-full w-full object-contain" />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">No image yet</div>
            )}
          </div>
        </div>

        <div>
          {product.category?.name && <span className="text-sm text-gray-400">{product.category.name}</span>}
          <h1 className="mt-1 text-3xl font-bold">{product.name}</h1>
          <div className="mt-2"><Rating value={product.rating || 0} showValue /></div>
          <div className="mt-4 flex items-baseline gap-3">
            <div className="text-3xl font-semibold text-gray-900">{formatPaise(product.basePricePaise)}</div>
            {product.compareAtPricePaise > product.basePricePaise && (
              <>
                <span className="text-lg text-gray-400 line-through">{formatPaise(product.compareAtPricePaise)}</span>
                <span className="rounded-full bg-green-600 px-2 py-0.5 text-xs font-bold text-white">
                  {Math.round(((product.compareAtPricePaise - product.basePricePaise) / product.compareAtPricePaise) * 100)}% OFF
                </span>
              </>
            )}
          </div>
          {toLines(product.highlights).length > 0 ? (
            <ul className="mt-4 space-y-1.5">
              {toLines(product.highlights).map((h, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-600">
                  <span className="mt-0.5 text-indigo-600">✓</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          ) : (
            product.description && <p className="mt-4 text-gray-600">{product.description}</p>
          )}

          {/* Colour selection */}
          {product.colors?.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                Colour
                {selectedColor && <span className="font-normal text-gray-500">— {selectedColor.name || selectedColor.hex}</span>}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.colors.map((c, i) => {
                  const active = selectedColor?.hex?.toLowerCase() === c.hex?.toLowerCase();
                  return (
                    <button
                      key={`${c.hex}-${i}`}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      title={c.name || c.hex}
                      aria-label={c.name || c.hex}
                      className={`h-9 w-9 rounded-full border shadow-sm transition ${active ? 'border-indigo-600 ring-2 ring-indigo-300 ring-offset-1' : 'border-black/10 hover:scale-105'}`}
                      style={{ background: c.hex }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center rounded-full border border-gray-300">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 text-gray-600 hover:bg-gray-50">−</button>
              <span className="min-w-8 px-2 text-center text-sm">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="px-3 py-2 text-gray-600 hover:bg-gray-50">+</button>
            </div>
            <button
              onClick={handleAdd}
              disabled={addState === 'adding'}
              className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {addState === 'adding' ? 'Adding…' : 'Add to cart'}
            </button>
          </div>
          <p className="mt-3 text-xs text-gray-400">Looking to personalize? Try our <Link to="/nameplates" className="font-medium text-indigo-600 hover:underline">Name Plate Studio</Link> or <Link to="/neon" className="font-medium text-indigo-600 hover:underline">Neon Studio</Link>.</p>
        </div>
      </div>

      {/* Product detail sections (admin-editable) */}
      {(() => {
        const descLines = toLines(product.description);
        const specs = [['Material', product.material], ['Dimensions', product.dimensions]].filter(([, v]) => v);
        const included = toLines(product.whatsIncluded);
        const care = toLines(product.careHandling);
        const hasAny = product.description || specs.length || included.length || care.length;
        if (!hasAny) return null;
        return (
          <section className="mt-12 max-w-3xl">
            {product.description && (
              <Accordion title="Description" defaultOpen>
                {descLines.length > 1 ? (
                  <ul className="list-disc space-y-1.5 pl-5">{descLines.map((l, i) => <li key={i}>{l}</li>)}</ul>
                ) : (
                  <p>{product.description}</p>
                )}
              </Accordion>
            )}
            {specs.length > 0 && (
              <Accordion title="Product specifications">
                <dl className="space-y-1">
                  {specs.map(([label, value]) => (
                    <div key={label}>{label}: <span className="text-gray-700">{value}</span></div>
                  ))}
                </dl>
              </Accordion>
            )}
            {included.length > 0 && (
              <Accordion title="What's included">
                <ul className="space-y-1">{included.map((l, i) => <li key={i}>{l}</li>)}</ul>
              </Accordion>
            )}
            {care.length > 0 && (
              <Accordion title="Care & handling">
                <ul className="space-y-1">{care.map((l, i) => <li key={i}>{l}</li>)}</ul>
              </Accordion>
            )}
            <div className="border-t border-gray-200" />
          </section>
        );
      })()}

      {/* Reviews */}
      <section className="mt-16">
        <Reviews productId={product._id} slug={product.slug} />
      </section>

      {/* Similar products */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-xl font-bold">Similar products</h2>
          <ProductGrid products={related} />
        </section>
      )}

      {/* More products for you */}
      {recommended.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-xl font-bold">More products for you</h2>
          <ProductGrid products={recommended} columns="sm:grid-cols-2 lg:grid-cols-4" />
        </section>
      )}
    </div>
  );
}
