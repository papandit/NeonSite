// All admin routes, mounted at /api/admin and guarded by requireAuth +
// requireRole('admin'). Option collections are wired generically from the
// registry so adding a collection is a one-line registry change.

import { Router } from 'express';

import { requireAuth, requireRole } from '../../middleware/auth.js';
import { createCrudController } from '../../controllers/factories/crudControllerFactory.js';
import { crudRouter } from './crudRouter.js';

import Category from '../../models/Category.js';
import SubCategory from '../../models/SubCategory.js';
import Coupon from '../../models/Coupon.js';
import Banner from '../../models/Banner.js';
import { OPTION_COLLECTIONS } from '../../models/options/registry.js';
import productController from '../../controllers/admin/productController.js';
import uploadRoutes from './uploadRoutes.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { isCloudinaryConfigured } from '../../services/cloudinary/index.js';
import { dashboard, analytics } from '../../controllers/admin/dashboardController.js';
import { listOrders, getOrder, updateStatus, productionRender } from '../../controllers/admin/adminOrderController.js';
import { getStoreSettings, updateStoreSettings } from '../../controllers/admin/settingsController.js';
import { getNeonConfigAdmin, updateNeonConfig } from '../../controllers/admin/neonController.js';
import { adminListReviews, moderateReview } from '../../controllers/reviewController.js';

const router = Router();

// Everything below requires an authenticated admin.
router.use(requireAuth, requireRole('admin'));

// Lets the admin UI know whether uploads will work (or fall back to URL paste).
router.get('/meta', (req, res) =>
  sendSuccess(res, {
    uploadsEnabled: isCloudinaryConfigured(),
    optionCollections: OPTION_COLLECTIONS.map((c) => ({
      key: c.key,
      panel: c.panel,
      label: c.label,
      metaFields: c.metaFields,
    })),
  })
);

// Uploads
router.use('/uploads', uploadRoutes);

// Categories + SubCategories
const categoryController = createCrudController(Category, {
  searchFields: ['name', 'slug'],
  defaultSort: 'sortOrder name',
});
const subCategoryController = createCrudController(SubCategory, {
  searchFields: ['name', 'slug'],
  populate: 'category',
  defaultSort: 'sortOrder name',
});
router.use('/categories', crudRouter(categoryController));
router.use('/subcategories', crudRouter(subCategoryController));

// All 8 option collections — same CRUD shape, generated from the registry.
for (const c of OPTION_COLLECTIONS) {
  const controller = createCrudController(c.model, {
    searchFields: ['name', 'slug'],
    defaultSort: 'name',
  });
  router.use(`/${c.key}`, crudRouter(controller));
}

// Products (custom controller — validates option references)
router.use('/products', crudRouter(productController));

// Coupons + Banners (generic CRUD)
const couponController = createCrudController(Coupon, {
  searchFields: ['code'],
  defaultSort: '-createdAt',
});
const bannerController = createCrudController(Banner, {
  searchFields: ['title'],
  defaultSort: 'sortOrder',
});
router.use('/coupons', crudRouter(couponController));
router.use('/banners', crudRouter(bannerController));

// Dashboard metrics + analytics
router.get('/dashboard', dashboard);
router.get('/analytics', analytics);

// Order management
router.get('/orders', listOrders);
router.get('/orders/:id', getOrder);
router.patch('/orders/:id/status', updateStatus);
router.get('/orders/:id/production-render/:itemId', productionRender);

// Store settings
router.get('/settings', getStoreSettings);
router.put('/settings', updateStoreSettings);

// Neon Studio catalogue
router.get('/neon', getNeonConfigAdmin);
router.put('/neon', updateNeonConfig);

// Reviews moderation
router.get('/reviews', adminListReviews);
router.patch('/reviews/:id/moderate', moderateReview);

export default router;

