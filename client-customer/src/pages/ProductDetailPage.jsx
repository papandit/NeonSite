import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProductBySlug, getRelatedProducts } from '../services/catalog';
import { formatPaise } from '../utils/money';
import Rating from '../components/Rating';
import ProductGrid from '../components/ProductGrid';
import Reviews from '../components/Reviews';
import Seo from '../components/Seo';

// Lazy-load the editor (and Fabric.js) so it only ships on the product page.
const Configurator = lazy(() => import('../configurator/Configurator'));

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
                <button key={i} onClick={() => setActiveImage(i)} className={`h-16 w-16 overflow-hidden rounded-lg border ${i === activeImage ? 'border-indigo-600' : 'border-gray-200'}`}>
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.category?.name && <span className="text-sm text-gray-400">{product.category.name}</span>}
          <h1 className="mt-1 text-3xl font-bold">{product.name}</h1>
          <div className="mt-2"><Rating value={product.rating || 0} showValue /></div>
          <div className="mt-4">
            <span className="text-sm text-gray-500">Starting at</span>
            <div className="text-3xl font-semibold text-gray-900">{formatPaise(product.basePricePaise)}</div>
          </div>
          {product.description && <p className="mt-4 text-gray-600">{product.description}</p>}
          <a href="#customize" className="mt-6 inline-block rounded-md bg-indigo-600 px-5 py-3 text-sm font-medium text-white hover:bg-indigo-700">
            Customize this plate ↓
          </a>
        </div>
      </div>

      {/* Live configurator */}
      <section id="customize" className="mt-16">
        <h2 className="mb-6 text-2xl font-bold">Design your plate</h2>
        <Suspense fallback={<div className="py-16 text-center text-gray-400">Loading editor…</div>}>
          <Configurator product={product} />
        </Suspense>
      </section>

      {/* Reviews */}
      <section className="mt-16">
        <Reviews productId={product._id} slug={product.slug} />
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
