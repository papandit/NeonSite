// Public Neon Studio routes (no auth): live catalogue + server price quote.

import { Router } from 'express';
import { getNeonConfigPublic, quoteNeonPublic } from '../controllers/public/neonController.js';

const router = Router();

router.get('/config', getNeonConfigPublic);
router.post('/quote', quoteNeonPublic);

export default router;
