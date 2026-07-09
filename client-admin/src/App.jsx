import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import AdminLayout from './layouts/AdminLayout';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import CategoriesPage from './pages/categories/CategoriesPage';
import SubCategoriesPage from './pages/categories/SubCategoriesPage';
import OptionCrudPage from './pages/options/OptionCrudPage';
import ProductsPage from './pages/products/ProductsPage';
import ProductBuilderPage from './pages/products/ProductBuilderPage';
import OrdersPage from './pages/orders/OrdersPage';
import OrderDetailPage from './pages/orders/OrderDetailPage';
import CouponsPage from './pages/CouponsPage';
import BannersPage from './pages/BannersPage';
import SettingsPage from './pages/SettingsPage';
import ReviewsPage from './pages/ReviewsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import NeonPage from './pages/NeonPage';
import NpDashboardPage from './pages/nameplate/NpDashboardPage';
import NpCrudPage from './pages/nameplate/NpCrudPage';
import NpTemplatesPage from './pages/nameplate/NpTemplatesPage';
import NpTemplateEditPage from './pages/nameplate/NpTemplateEditPage';
import NpPriceRulesPage from './pages/nameplate/NpPriceRulesPage';
import { loadProfile, selectIsAuthenticated } from './store/authSlice';

export default function App() {
  const dispatch = useDispatch();
  const isAuthed = useSelector(selectIsAuthenticated);

  useEffect(() => {
    if (isAuthed) dispatch(loadProfile());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<AdminProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />

          <Route path="categories" element={<CategoriesPage />} />
          <Route path="subcategories" element={<SubCategoriesPage />} />

          {/* One page for every option collection: /options/materials, etc. */}
          <Route path="options/:key" element={<OptionCrudPage />} />

          <Route path="products" element={<ProductsPage />} />
          <Route path="products/new" element={<ProductBuilderPage />} />
          <Route path="products/:id/edit" element={<ProductBuilderPage />} />
          <Route path="neon" element={<NeonPage />} />

          {/* Name Plate Studio (independent module) */}
          <Route path="nameplate/dashboard" element={<NpDashboardPage />} />
          <Route path="nameplate/templates" element={<NpTemplatesPage />} />
          <Route path="nameplate/templates/new" element={<NpTemplateEditPage />} />
          <Route path="nameplate/templates/:id" element={<NpTemplateEditPage />} />
          <Route path="nameplate/price-rules" element={<NpPriceRulesPage />} />
          <Route path="nameplate/c/:key" element={<NpCrudPage />} />

          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />

          <Route path="coupons" element={<CouponsPage />} />
          <Route path="banners" element={<BannersPage />} />
          <Route path="settings" element={<SettingsPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
