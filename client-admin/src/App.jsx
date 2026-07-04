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

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
