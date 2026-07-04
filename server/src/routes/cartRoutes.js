import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getCart, addItem, updateItem, removeItem, clearCart } from '../controllers/cartController.js';

const router = Router();
router.use(requireAuth);

router.get('/', getCart);
router.post('/', addItem);
router.patch('/:itemId', updateItem);
router.delete('/:itemId', removeItem);
router.delete('/', clearCart);

export default router;
