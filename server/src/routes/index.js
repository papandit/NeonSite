// Mounts all /api/* routes. Feature routers are added here as phases land.

import { Router } from 'express';
import authRoutes from './authRoutes.js';
import adminRoutes from './admin/index.js';
import catalogRoutes from './catalogRoutes.js';
import pricingRoutes from './pricingRoutes.js';
import renderRoutes from './renderRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/pricing', pricingRoutes);
router.use('/render', renderRoutes);

// Public catalog read (Phase 2): /api/categories, /api/products, /api/products/:slug
router.use('/', catalogRoutes);

// Placeholder for future phases:
// router.use('/cart', cartRoutes);              // Phase 4

export default router;
