import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWishlist, selectWishlistProducts } from '../../store/wishlistSlice';
import ProductGrid from '../../components/ProductGrid';

export default function WishlistPage() {
  const dispatch = useDispatch();
  const products = useSelector(selectWishlistProducts);

  useEffect(() => {
    dispatch(fetchWishlist());
  }, [dispatch]);

  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
        <p className="text-gray-500">Your wishlist is empty.</p>
        <Link to="/products" className="mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Browse products</Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Wishlist</h2>
      <ProductGrid products={products} columns="sm:grid-cols-2 lg:grid-cols-3" />
    </div>
  );
}
