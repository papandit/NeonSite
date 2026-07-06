// Public chatbot endpoint (rate-limited via the quote limiter to curb abuse).

import { Router } from 'express';
import { chat } from '../controllers/chatController.js';
import { quoteLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/', quoteLimiter, chat);

export default router;
