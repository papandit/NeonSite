// Admin Name Plate Studio routes. Mounted under /api/admin/nameplate (already
// guarded by requireAuth + requireRole('admin')). Every simple collection gets
// standard CRUD from the registry; templates + price-rules are wired explicitly.

import { Router } from 'express';
import { createCrudController } from '../../../controllers/factories/crudControllerFactory.js';
import { crudRouter } from '../../../routes/admin/crudRouter.js';
import { NP_COLLECTIONS } from '../registry.js';
import NpTemplate from '../models/NpTemplate.js';
import { getPriceRules, updatePriceRules } from '../controllers/priceRulesController.js';

const router = Router();

// categories, fonts, colors, elements, icons, shapes, materials, sizes, backgrounds
for (const c of NP_COLLECTIONS) {
  const controller = createCrudController(c.model, {
    searchFields: ['name', 'slug'],
    defaultSort: 'sortOrder name',
  });
  router.use(`/${c.key}`, crudRouter(controller));
}

// Templates (with category populate).
const templateController = createCrudController(NpTemplate, {
  searchFields: ['name', 'slug'],
  statusOn: 'active',
  statusOff: 'hidden',
  populate: 'category',
  defaultSort: 'sortOrder -createdAt',
});
router.use('/templates', crudRouter(templateController));

// Price rules singleton.
router.get('/price-rules', getPriceRules);
router.put('/price-rules', updatePriceRules);

export default router;
