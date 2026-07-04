// Admin order management. Status changes are validated by the state machine and
// APPENDED to statusHistory (INVARIANT 4 — never overwritten). Production
// renders are regenerated from the frozen designDocument on demand.

import mongoose from 'mongoose';
import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import ApiError from '../../utils/ApiError.js';
import Order from '../../models/Order.js';
import { checkTransition, nextStatuses } from '../../services/orders/stateMachine.js';
import { renderProduction } from '../../services/render/renderProduction.js';

// GET /api/admin/orders?status=&q=&page=&limit=
export const listOrders = asyncHandler(async (req, res) => {
  const { status, q, page = '1', limit = '20' } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const match = {};
  if (q && String(q).trim()) match.orderNumber = new RegExp(String(q).trim(), 'i');

  const pipeline = [
    { $match: match },
    {
      $addFields: {
        currentStatus: { $arrayElemAt: ['$statusHistory.status', -1] },
        itemCount: { $sum: '$items.quantity' },
      },
    },
    ...(status ? [{ $match: { currentStatus: status } }] : []),
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limitNum },
          { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userDoc' } },
          {
            $project: {
              orderNumber: 1, totalPaise: 1, currentStatus: 1, itemCount: 1, createdAt: 1,
              preview: { $arrayElemAt: ['$items.previewImageUrl', 0] },
              userName: { $arrayElemAt: ['$userDoc.name', 0] },
              userEmail: { $arrayElemAt: ['$userDoc.email', 0] },
            },
          },
        ],
        total: [{ $count: 'count' }],
      },
    },
  ];

  const [result] = await Order.aggregate(pipeline);
  const total = result.total[0]?.count || 0;

  return sendSuccess(res, result.data, 200, {
    meta: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

// GET /api/admin/orders/:id
export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .lean({ virtuals: true });
  if (!order) throw ApiError.notFound('Order not found');
  const current = order.statusHistory?.[order.statusHistory.length - 1]?.status;
  return sendSuccess(res, { ...order, nextStatuses: nextStatuses(current) });
});

// PATCH /api/admin/orders/:id/status  { status, note, override }
export const updateStatus = asyncHandler(async (req, res) => {
  const { status, note, override = false } = req.body || {};
  if (!status) throw ApiError.badRequest('status is required');

  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');

  const current = order.statusHistory[order.statusHistory.length - 1]?.status;
  const check = checkTransition(current, status, { override });
  if (!check.ok) {
    throw ApiError.badRequest(check.reason, { code: 'ILLEGAL_TRANSITION' });
  }

  // Append — never overwrite.
  order.statusHistory.push({ status, note: note || '', by: req.user.id, at: new Date() });
  await order.save();

  const fresh = await Order.findById(order._id).populate('user', 'name email').lean({ virtuals: true });
  return sendSuccess(res, { ...fresh, nextStatuses: nextStatuses(status) });
});

// GET /api/admin/orders/:id/production-render/:itemId  -> streams a PNG
export const productionRender = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');
  const item = order.items.id(req.params.itemId);
  if (!item) throw ApiError.notFound('Order item not found');

  const { buffer, mime } = await renderProduction(item.designDocument);

  res.set('Content-Type', mime);
  res.set(
    'Content-Disposition',
    `attachment; filename="${order.orderNumber}-${req.params.itemId}.png"`
  );
  return res.send(buffer);
});
