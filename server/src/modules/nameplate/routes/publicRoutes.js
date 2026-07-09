// Public Name Plate Studio routes (no auth). The customer designer reads
// templates + options here and gets a server price; designs can be saved.

import { Router } from 'express';
import {
  listCategories, listTemplates, getTemplate, quote, saveDesign,
} from '../controllers/publicController.js';

const router = Router();

router.get('/categories', listCategories);
router.get('/templates', listTemplates);
router.get('/templates/:slug', getTemplate);
router.post('/templates/:slug/quote', quote);
router.post('/designs', saveDesign);

export default router;
