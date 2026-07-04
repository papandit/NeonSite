import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProductBySlug, getRelatedProducts } from '../services/catalog';
import { formatPaise } from '../utils/money';
import Rating from '../components/Rating';
import ProductGrid from '../components/ProductGrid';

// Panels shown (in order) in the customization preview.
const PANELS = [
  ['material', 'Materials'],
  ['size', 'Sizes'],
  ['font', 'Fonts'],
  ['color', 'Colours'],
  ['background', 'Backgrounds'],
  ['border', 'Borders'],
  ['mountType', 'Mounts'],
  ['icons', 'Icons'],
];

function CustomizationPreview({ config }) {
  const enabled = PANELS.filter(([key]) => config?.[key]?.enabled && config[key].options?.length);

  return (
    <div className="rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 p-6">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-medium text-white">Phase 3</span>
        <h3 className="font-semibold text-gray-900">Live customization editor</h3>
      </div>
      <p className="mt-1 text-sm text-gray-600">
        The interactive canvas editor with live pricing lands in Phase 3. Here’s what you’ll be able
        to customize on this plate:
      </p>

      <div className="mt-4 space-y-3">
        {enabled.map(([key, label]) => (
          <div key={key}>
            <div className="text-xs font-medium uppercase text-gray-400">
              {label}
              {config[key].required && <span className="ml-1 text-indigo-500">• required</span>}
              {key === 'icons' && <span className="ml-1 text-gray-400">(up to {config.icons.max})</span>}
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {config[key].options.map((o) => (
                <span key={o._id} className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700">
                  {o.meta?.hex && <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: o.meta.hex }} />}
                  {o.name}
                  {o.priceDeltaPaise > 0 && <span className="text-gray-400">+{formatPaise(o.priceDeltaPaise)}</span>}
                </span>
              ))}
            </div>
          </div>
        ))}

        {config?.textFields?.length > 0 && (
          <div>
            <div className="text-xs font-medium uppercase text-gray-400">Text fields</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {config.textFields.map((t) => (
                <span key={t.key} className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700">
                  {t.label} <span className="text-gray-400">(≤{t.maxLength})</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <button disabled className="mt-5 w-full cursor-not-allowed rounded-md bg-indigo-300 px-4 py-2.5 text-sm font-medium text-white">
        Open editor — coming in Phase 3
      </button>
    </div>
  );
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setActiveImage(0);
    getProductBySlug(slug)
      .then((p) => setProduct(p))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
    getRelatedProducts(slug).then(setRelated).catch(() => setRelated([]));
  }, [slug]);

  if (loading) return <div className="mx-auto max-w-6xl px-4 py-20 text-center text-gray-400">Loading…</div>;

  if (notFound || !product) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-xl font-semibold">Product not found</h1>
        <Link to="/products" className="mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          Browse products
        </Link>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
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

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="aspect-square overflow-hidden rounded-xl border border-gray-200 bg-slate-50">
            {images[activeImage] ? (
              <img src={images[activeImage]} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">No image yet</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`h-16 w-16 overflow-hidden rounded-lg border ${i === activeImage ? 'border-indigo-600' : 'border-gray-200'}`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info + customization slot */}
        <div>
          {product.category?.name && <span className="text-sm text-gray-400">{product.category.name}</span>}
          <h1 className="mt-1 text-3xl font-bold">{product.name}</h1>
          <div className="mt-2 flex items-center gap-3">
            <Rating value={product.rating || 0} showValue />
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-500">Starting at</span>
            <div className="text-3xl font-semibold text-gray-900">{formatPaise(product.basePricePaise)}</div>
          </div>
          {product.description && <p className="mt-4 text-gray-600">{product.description}</p>}

          <div className="mt-6">
            <CustomizationPreview config={product.customizationConfig} />
          </div>
        </div>
      </div>

      {/* Reviews (placeholder — full reviews in Phase 6) */}
      <section className="mt-16">
        <h2 className="text-xl font-bold">Reviews</h2>
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          Customer reviews will appear here once this product has been purchased and reviewed.
          (Reviews system lands in Phase 6.)
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-xl font-bold">Related products</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
