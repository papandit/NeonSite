// Public asset serving (no auth) — MongoDB-stored uploads.

import { Router } from 'express';
import { getAsset } from '../controllers/public/assetController.js';

const router = Router();
router.get('/:id', getAsset);

export default router;
