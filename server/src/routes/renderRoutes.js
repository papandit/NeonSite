// Render/preview routes. Preview upload is public so guests can design and
// preview before creating an account (the cart write in Phase 4 is the auth
// gate). Rate limiting is added in Phase 6.

import { Router } from 'express';
import { uploadPreview, uploadCustomerImage } from '../controllers/render/previewController.js';

const router = Router();

router.post('/preview-upload', uploadPreview);
router.post('/customer-upload', uploadCustomerImage);

export default router;
