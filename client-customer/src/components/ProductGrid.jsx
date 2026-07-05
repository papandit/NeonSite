import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ProductCard from './ProductCard';
import QuickView from './QuickView';
import { selectIsAuthenticated } from '../store/authSlice';
import { selectWishlistIds, toggleWishlistItem } from '../store/wishlistSlice';
import { quickAddToCart } from '../store/cartSlice';

export default function ProductGrid({ products, columns = 'sm:grid-cols-2 lg:grid-cols-4' }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthed = useSelector(selectIsAuthenticated);
  const wishlistIds = useSelector(selectWishlistIds);
  const [quick, setQuick] = useState(null);

  const onWishlist = (id) => {
    if (!isAuthed) {
      navigate('/login', { state: { from: { pathname: '/products' } } });
      return;
    }
    dispatch(toggleWishlistItem(id));
  };

  // Buy as-is: quick add with a default design, then go to the cart.
  const onAddToCart = async (product) => {
    if (!isAuthed) {
      navigate('/login', { state: { from: { pathname: '/products' } } });
      return Promise.reject(new Error('login required'));
    }
    await dispatch(quickAddToCart({ productId: product._id, quantity: 1 })).unwrap();
    navigate('/cart');
  };

  return (
    <>
      <div className={`grid grid-cols-1 gap-5 ${columns}`}>
        {products.map((p) => (
          <ProductCard
            key={p._id}
            product={p}
            wishlisted={wishlistIds.includes(String(p._id))}
            onWishlist={onWishlist}
            onQuickView={setQuick}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
      <QuickView product={quick} onClose={() => setQuick(null)} onAddToCart={onAddToCart} />
    </>
  );
}
