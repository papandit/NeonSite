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
  const swatches = product.swatches || [];
  const [selectedColor, setSelectedColor] = useState(swatches[0] || null);
  // Ready-made neon signs carry lit/unlit artwork — light up on hover.
  const isNeon = Boolean(product.isNeon && (product.lightOnImageUrl || product.lightOffImageUrl));

  const handleAdd = async () => {
    if (!onAddToCart || addState === 'adding') return;
    setAddState('adding');
    try {
      await onAddToCart(product, selectedColor);
      setAddState('added');
      setTimeout(() => setAddState('idle'), 1600);
    } catch {
      setAddState('idle'); // e.g. guest redirected to login
    }
  };

  const addLabel = addState === 'adding' ? 'Adding…' : addState === 'added' ? 'Added ✓' : 'Add to cart';

  // Pricing: basePricePaise is the selling price; compareAtPricePaise is the MRP.
  const mrp = product.compareAtPricePaise || 0;
  const hasOffer = mrp > product.basePricePaise;
  const discountPct = hasOffer ? Math.round(((mrp - product.basePricePaise) / mrp) * 100) : 0;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:shadow-md">
      <div className="relative aspect-square overflow-hidden">
        {hasOffer && (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-gold-500 px-2 py-0.5 text-xs font-bold text-black shadow-sm">
            {discountPct}% OFF
          </span>
        )}
        <Link to={`/products/${product.slug}`}>
          {isNeon ? (
            /* Neon sign — lights up on hover (off artwork → on artwork) */
            <span className="relative block h-full w-full bg-[#141118]">
              <img src={product.lightOffImageUrl || product.lightOnImageUrl} alt={product.name} className="h-full w-full object-contain transition-opacity duration-300 group-hover:opacity-0" />
              <img src={product.lightOnImageUrl || product.lightOffImageUrl} alt="" aria-hidden className="absolute inset-0 h-full w-full object-contain opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-gray-700 shadow-sm">✨ Hover to light up</span>
            </span>
          ) : product.images?.[0] ? (
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

        {/* Colour swatches — click to pick the colour added to the cart */}
        {swatches.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            {swatches.slice(0, 6).map((s, i) => {
              const active = selectedColor?.hex?.toLowerCase() === s.hex?.toLowerCase();
              return (
                <button
                  key={`${s.hex}-${i}`}
                  type="button"
                  onClick={() => setSelectedColor(s)}
                  title={s.name || s.hex}
                  aria-label={s.name || s.hex}
                  className={`h-5 w-5 rounded-full border shadow-sm transition ${active ? 'border-indigo-600 ring-2 ring-indigo-300 ring-offset-1' : 'border-black/10 hover:scale-110'}`}
                  style={{ background: s.hex }}
                />
              );
            })}
            {swatches.length > 6 && <span className="text-xs text-gray-400">+{swatches.length - 6}</span>}
          </div>
        )}

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-xs text-gray-400">from </span>
          <span className="text-lg font-semibold text-gray-900">{formatPaise(product.basePricePaise)}</span>
          {hasOffer && (
            <>
              <span className="text-sm text-gray-400 line-through">{formatPaise(mrp)}</span>
              <span className="text-xs font-semibold text-gold-700">{discountPct}% off</span>
            </>
          )}
        </div>

        {/* Simple store product: view details or add to cart */}
        <div className="mt-3 flex gap-2">
          <Link
            to={`/products/${product.slug}`}
            className="rounded-full border border-gray-300 px-3 py-2 text-center text-sm font-semibold text-gray-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
          >
            View
          </Link>
          <button
            onClick={handleAdd}
            disabled={addState === 'adding'}
            className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold text-white transition ${
              addState === 'added' ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {addLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
