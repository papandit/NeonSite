import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getProductBySlug, getRelatedProducts, getRecommendedProducts } from '../services/catalog';
import { formatPaise } from '../utils/money';
import { quickAddToCart } from '../store/cartSlice';
import { selectIsAuthenticated } from '../store/authSlice';
import Rating from '../components/Rating';
import ProductGrid from '../components/ProductGrid';
import Reviews from '../components/Reviews';
import Seo from '../components/Seo';

// Lazy-load the editor (and Fabric.js) so it only ships on the product page.
const Configurator = lazy(() => import('../configurator/Configurator'));

export default function ProductDetailPage() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthed = useSelector(selectIsAuthenticated);
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [addState, setAddState] = useState('idle');

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setActiveImage(0);
    getProductBySlug(slug)
      .then((p) => setProduct(p))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
    getRelatedProducts(slug).then(setRelated).catch(() => setRelated([]));
    getRecommendedProducts({ exclude: slug, limit: 4 }).then(setRecommended).catch(() => setRecommended([]));
  }, [slug]);

  const handleQuickAdd = async () => {
    if (!isAuthed) {
      navigate('/login', { state: { from: { pathname: `/products/${slug}` } } });
      return;
    }
    setAddState('adding');
    try {
      await dispatch(quickAddToCart({ productId: product._id, quantity: 1 })).unwrap();
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
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#customize" className="rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
              Customize this plate ↓
            </a>
            <button
              onClick={handleQuickAdd}
              disabled={addState === 'adding'}
              className={`rounded-full border px-5 py-3 text-sm font-semibold transition disabled:opacity-60 ${
                addState === 'added'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700'
              }`}
            >
              {addState === 'adding' ? 'Adding…' : addState === 'added' ? 'Added to cart ✓' : 'Add to cart (as-is)'}
            </button>
            {addState === 'added' && (
              <Link to="/cart" className="self-center text-sm font-medium text-indigo-600 hover:underline">
                View cart →
              </Link>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-400">Buy as-is with default options, or customize it your way.</p>
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
