// Mounts all /api/* routes. Feature routers are added here as phases land.

import { Router } from 'express';
import authRoutes from './authRoutes.js';

const router = Router();

router.use('/auth', authRoutes);

// Placeholder for future phases:
// router.use('/categories', categoryRoutes);
// router.use('/products', productRoutes);
// router.use('/pricing', pricingRoutes);
// router.use('/cart', cartRoutes);
// router.use('/admin', adminRoutes);

export default router;
