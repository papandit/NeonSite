import { useState } from 'react';
import ProductCard from './ProductCard';
import QuickView from './QuickView';
import { useWishlist } from '../hooks/useWishlist';

export default function ProductGrid({ products, columns = 'sm:grid-cols-2 lg:grid-cols-4' }) {
  const wishlist = useWishlist();
  const [quick, setQuick] = useState(null);

  return (
    <>
      <div className={`grid grid-cols-1 gap-5 ${columns}`}>
        {products.map((p) => (
          <ProductCard
            key={p._id}
            product={p}
            wishlisted={wishlist.has(p._id)}
            onWishlist={wishlist.toggle}
            onQuickView={setQuick}
          />
        ))}
      </div>
      <QuickView product={quick} onClose={() => setQuick(null)} />
    </>
  );
}
