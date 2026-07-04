// Public catalog routes (no auth). Order matters: the /related and /:slug
// routes live under /products.

import { Router } from 'express';
import {
  listCategories,
  listProducts,
  getProductBySlug,
  getRelatedProducts,
} from '../controllers/public/catalogController.js';
import { listProductReviews } from '../controllers/reviewController.js';

const router = Router();

router.get('/categories', listCategories);
router.get('/products', listProducts);
router.get('/products/:slug/related', getRelatedProducts);
router.get('/products/:slug/reviews', listProductReviews);
router.get('/products/:slug', getProductBySlug);

export default router;
