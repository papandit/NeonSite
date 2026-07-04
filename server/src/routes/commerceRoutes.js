// Coupons, checkout, payments, and customer orders. This router is mounted at
// '/', so auth is applied PER-ROUTE (a blanket router.use(requireAuth) would
// reject public catalog requests that fall through to the next router).

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { couponLimiter } from '../middleware/rateLimit.js';
import { applyCoupon } from '../controllers/couponController.js';
import { checkoutQuote } from '../controllers/checkoutController.js';
import { createRazorpayOrder, verifyPayment } from '../controllers/paymentsController.js';
import { listMyOrders, getMyOrder, getMyInvoice } from '../controllers/ordersController.js';

const router = Router();

router.post('/coupons/apply', requireAuth, couponLimiter, applyCoupon);
router.post('/checkout/quote', requireAuth, checkoutQuote);
router.post('/payments/razorpay/order', requireAuth, createRazorpayOrder);
router.post('/payments/razorpay/verify', requireAuth, verifyPayment);
router.get('/orders', requireAuth, listMyOrders);
router.get('/orders/:id', requireAuth, getMyOrder);
router.get('/orders/:id/invoice', requireAuth, getMyInvoice);

export default router;
