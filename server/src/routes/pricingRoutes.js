// Configurator pricing (public — the editor calls this while designing, before
// login). Server-authoritative pricing; client-sent pricing is ignored.

import { Router } from 'express';
import { quote } from '../controllers/pricingController.js';

const router = Router();

router.post('/quote', quote);

export default router;
