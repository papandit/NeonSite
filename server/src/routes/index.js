// Mounts all /api/* routes. Feature routers are added here as phases land.

import { Router } from 'express';
import authRoutes from './authRoutes.js';
import adminRoutes from './admin/index.js';
import catalogRoutes from './catalogRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);

// Public catalog read (Phase 2): /api/categories, /api/products, /api/products/:slug
router.use('/', catalogRoutes);

// Placeholder for future phases:
// router.use('/pricing', pricingRoutes);        // Phase 3
// router.use('/cart', cartRoutes);              // Phase 4

export default router;
