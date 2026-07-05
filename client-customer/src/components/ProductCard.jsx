import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatPaise } from '../utils/money';
import Rating from './Rating';

function Placeholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-slate-100 to-slate-200 text-slate-400">
      <span className="text-sm">No image</span>
    </div>
  );
}

export default function ProductCard({ product, wishlisted = false, onWishlist, onQuickView, onAddToCart }) {
  const [addState, setAddState] = useState('idle'); // idle | adding | added

  const handleAdd = async () => {
    if (!onAddToCart || addState === 'adding') return;
    setAddState('adding');
    try {
      await onAddToCart(product);
      setAddState('added');
      setTimeout(() => setAddState('idle'), 1600);
    } catch {
      setAddState('idle'); // e.g. guest redirected to login
    }
  };

  const addLabel = addState === 'adding' ? 'Adding…' : addState === 'added' ? 'Added ✓' : 'Add to cart';

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:shadow-md">
      <div className="relative aspect-square overflow-hidden">
        <Link to={`/products/${product.slug}`}>
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-full w-full object-cover transition group-hover:scale-105"
            />
          ) : (
            <Placeholder />
          )}
        </Link>

        {/* Wishlist */}
        <button
          onClick={() => onWishlist?.(product._id)}
          aria-label="Toggle wishlist"
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-lg shadow-sm hover:bg-white"
        >
          <span className={wishlisted ? 'text-red-500' : 'text-slate-400'}>{wishlisted ? '♥' : '♡'}</span>
        </button>

        {/* Quick view (hover) */}
        {onQuickView && (
          <button
            onClick={() => onQuickView(product)}
            className="absolute inset-x-2 bottom-2 rounded-full bg-white/95 py-2 text-sm font-medium text-gray-800 opacity-0 shadow-sm transition group-hover:opacity-100 hover:bg-white"
          >
            Quick view
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {product.category?.name && <span className="text-xs text-gray-400">{product.category.name}</span>}
        <Link to={`/products/${product.slug}`} className="mt-0.5 font-medium text-gray-900 hover:text-indigo-600">
          {product.name}
        </Link>
        <div className="mt-1 flex items-center gap-2">
          <Rating value={product.rating || 0} />
        </div>

        <div className="mt-3">
          <span className="text-xs text-gray-400">from </span>
          <span className="text-lg font-semibold text-gray-900">{formatPaise(product.basePricePaise)}</span>
        </div>

        {/* Both actions: personalize OR buy as-is */}
        <div className="mt-3 flex gap-2">
          <Link
            to={`/products/${product.slug}`}
            className="flex-1 rounded-full bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Customize
          </Link>
          <button
            onClick={handleAdd}
            disabled={addState === 'adding'}
            className={`flex-1 rounded-full border px-3 py-2 text-sm font-semibold transition ${
              addState === 'added'
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-300 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700'
            }`}
          >
            {addLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
