// Public catalog routes (no auth). Order matters: the /related and /:slug
// routes live under /products.

import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.js';
import {
  listCategories,
  listProducts,
  getProductBySlug,
  getRelatedProducts,
  getRecommendedProducts,
  listBanners,
} from '../controllers/public/catalogController.js';
import { listProductReviews } from '../controllers/reviewController.js';
import { getPublicSettings } from '../controllers/public/settingsController.js';

const router = Router();

router.get('/settings', getPublicSettings);
router.get('/banners', listBanners);
router.get('/categories', listCategories);
router.get('/products', listProducts);
// Literal route must come before /products/:slug so it isn't captured as a slug.
router.get('/products/recommended', getRecommendedProducts);
router.get('/products/:slug/related', getRelatedProducts);
// optionalAuth so a signed-in visitor's own reviews come back flagged.
router.get('/products/:slug/reviews', optionalAuth, listProductReviews);
router.get('/products/:slug', getProductBySlug);

export default router;
