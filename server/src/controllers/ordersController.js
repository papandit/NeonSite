// Customer orders (auth) — a user can only see their own orders.

import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import ApiError from '../utils/ApiError.js';
import Order from '../models/Order.js';

// GET /api/orders  (own, summaries)
export const listMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).sort('-createdAt').lean({ virtuals: true });
  const summaries = orders.map((o) => ({
    _id: o._id,
    orderNumber: o.orderNumber,
    totalPaise: o.totalPaise,
    itemCount: o.items.reduce((n, it) => n + it.quantity, 0),
    status: o.statusHistory?.[o.statusHistory.length - 1]?.status,
    previewImageUrl: o.items?.[0]?.previewImageUrl || null,
    createdAt: o.createdAt,
  }));
  return sendSuccess(res, summaries);
});

// GET /api/orders/:id  (own, full)
export const getMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user.id }).lean({ virtuals: true });
  if (!order) throw ApiError.notFound('Order not found');
  return sendSuccess(res, order);
});
