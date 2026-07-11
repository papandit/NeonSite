import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import StorefrontLayout from './layouts/StorefrontLayout';
import AccountLayout from './layouts/AccountLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import { Toaster } from './lib/toast';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import NeonPage, { PENDING_NEON_KEY } from './pages/NeonPage';
import NamePlatesPage from './pages/NamePlatesPage';
import NamePlateDesignerPage, { PENDING_NAMEPLATE_KEY } from './pages/NamePlateDesignerPage';
import InfoPage from './pages/InfoPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';
import OrdersPage from './pages/account/OrdersPage';
import OrderDetailPage from './pages/account/OrderDetailPage';
import AddressesPage from './pages/account/AddressesPage';
import ProfilePage from './pages/account/ProfilePage';
import WishlistPage from './pages/account/WishlistPage';
import { loadProfile, selectIsAuthenticated } from './store/authSlice';
import { addToCart, addNeonToCart, addNameplateToCart, fetchCart } from './store/cartSlice';
import { fetchWishlist } from './store/wishlistSlice';
import { PENDING_KEY } from './configurator/Configurator';

export default function App() {
  const dispatch = useDispatch();
  const isAuthed = useSelector(selectIsAuthenticated);

  useEffect(() => {
    if (isAuthed) dispatch(loadProfile());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On auth: flush any design added before login, then load cart + wishlist.
  useEffect(() => {
    if (!isAuthed) return;
    const pending = localStorage.getItem(PENDING_KEY);
    const pendingNeon = localStorage.getItem(PENDING_NEON_KEY);
    const pendingNameplate = localStorage.getItem(PENDING_NAMEPLATE_KEY);
    if (pending) {
      try {
        dispatch(addToCart(JSON.parse(pending)));
      } catch {
        /* ignore malformed pending item */
      }
      localStorage.removeItem(PENDING_KEY);
    } else if (pendingNeon) {
      try {
        dispatch(addNeonToCart({ spec: JSON.parse(pendingNeon) }));
      } catch {
        /* ignore malformed pending neon */
      }
      localStorage.removeItem(PENDING_NEON_KEY);
    } else if (pendingNameplate) {
      try {
        dispatch(addNameplateToCart(JSON.parse(pendingNameplate)));
      } catch {
        /* ignore malformed pending name plate */
      }
      localStorage.removeItem(PENDING_NAMEPLATE_KEY);
    } else {
      dispatch(fetchCart());
    }
    dispatch(fetchWishlist());
  }, [isAuthed, dispatch]);

  return (
    <>
      <ScrollToTop />
      <Toaster />
      <Routes>
      <Route element={<StorefrontLayout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:slug" element={<ProductDetailPage />} />
        <Route path="neon" element={<NeonPage />} />
        <Route path="nameplates" element={<NamePlatesPage />} />
        <Route path="nameplates/:slug" element={<NamePlateDesignerPage />} />
        <Route path="p/:slug" element={<InfoPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="account" element={<AccountLayout />}>
            <Route index element={<Navigate to="/account/orders" replace />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="wishlist" element={<WishlistPage />} />
            <Route path="addresses" element={<AddressesPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
      </Routes>
    </>
  );
}
