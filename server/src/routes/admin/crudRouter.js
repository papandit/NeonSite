// Turns a CRUD controller (from createCrudController) into a standard router:
//   GET    /          list
//   POST   /          create
//   GET    /:id       getOne
//   PATCH  /:id       update
//   DELETE /:id       delete
//   PATCH  /:id/toggle toggle status

import { Router } from 'express';

export function crudRouter(controller) {
  const router = Router();
  router.get('/', controller.list);
  router.post('/', controller.create);
  router.get('/:id', controller.getOne);
  router.patch('/:id', controller.update);
  router.delete('/:id', controller.remove);
  router.patch('/:id/toggle', controller.toggleStatus);
  return router;
}

export default crudRouter;
