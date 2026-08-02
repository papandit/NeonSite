// Reviews (create) + wishlist — auth per-route (mounted at '/').

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createReview, uploadReviewFiles } from '../controllers/reviewController.js';
import { handleUpload, uploadReviewMedia } from '../middleware/upload.js';
import { reviewLimiter, reviewMediaLimiter } from '../middleware/rateLimit.js';
import { getWishlist, toggleWishlist } from '../controllers/wishlistController.js';

const router = Router();

// Attachments upload first, then the review references them by asset URL.
router.post('/reviews/media', requireAuth, reviewMediaLimiter, handleUpload(uploadReviewMedia), uploadReviewFiles);
router.post('/reviews', requireAuth, reviewLimiter, createReview);
router.get('/wishlist', requireAuth, getWishlist);
router.post('/wishlist/toggle', requireAuth, toggleWishlist);

export default router;
