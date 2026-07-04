// Reviews (create) + wishlist — auth per-route (mounted at '/').

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createReview } from '../controllers/reviewController.js';
import { getWishlist, toggleWishlist } from '../controllers/wishlistController.js';

const router = Router();

router.post('/reviews', requireAuth, createReview);
router.get('/wishlist', requireAuth, getWishlist);
router.post('/wishlist/toggle', requireAuth, toggleWishlist);

export default router;
