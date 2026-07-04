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

export default function ProductCard({ product, wishlisted = false, onWishlist, onQuickView }) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-md">
      <div className="relative aspect-square overflow-hidden">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <Placeholder />
        )}

        {/* Wishlist */}
        <button
          onClick={() => onWishlist?.(product._id)}
          aria-label="Toggle wishlist"
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-lg shadow-sm hover:bg-white"
        >
          <span className={wishlisted ? 'text-red-500' : 'text-slate-400'}>
            {wishlisted ? '♥' : '♡'}
          </span>
        </button>

        {/* Quick view (hover) */}
        {onQuickView && (
          <button
            onClick={() => onQuickView(product)}
            className="absolute inset-x-2 bottom-2 rounded-md bg-white/95 py-2 text-sm font-medium text-gray-800 opacity-0 shadow-sm transition group-hover:opacity-100 hover:bg-white"
          >
            Quick view
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {product.category?.name && (
          <span className="text-xs text-gray-400">{product.category.name}</span>
        )}
        <Link to={`/products/${product.slug}`} className="mt-0.5 font-medium text-gray-900 hover:text-indigo-600">
          {product.name}
        </Link>
        <div className="mt-1 flex items-center gap-2">
          <Rating value={product.rating || 0} />
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <div className="text-xs text-gray-400">from</div>
            <div className="text-lg font-semibold text-gray-900">{formatPaise(product.basePricePaise)}</div>
          </div>
          <Link
            to={`/products/${product.slug}`}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Customize
          </Link>
        </div>
      </div>
    </div>
  );
}
