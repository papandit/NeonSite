// Mounts all /api/* routes. Feature routers are added here as phases land.

import { Router } from 'express';
import authRoutes from './authRoutes.js';
import adminRoutes from './admin/index.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);

// Placeholder for future phases:
// router.use('/categories', categoryRoutes);   // public catalog read (Phase 2)
// router.use('/products', productRoutes);       // public catalog read (Phase 2)
// router.use('/pricing', pricingRoutes);        // Phase 3
// router.use('/cart', cartRoutes);              // Phase 4

export default router;
