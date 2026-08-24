import { Router } from 'express';
import { register, login, profile } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter, loginLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', loginLimiter, login);
router.get('/profile', requireAuth, profile);

export default router;
