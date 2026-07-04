// GET /api/admin/dashboard — headline metrics. Money stays in paise; the client
// formats at the display edge.

import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import Order from '../../models/Order.js';
import User from '../../models/User.js';

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

const TERMINAL = ['delivered', 'cancelled'];

export const dashboard = asyncHandler(async (req, res) => {
  const todayStart = startOfToday();

  const [
    allTime,
    today,
    pendingAgg,
    customerCount,
    recentRaw,
  ] = await Promise.all([
    Order.aggregate([
      { $group: { _id: null, salesPaise: { $sum: '$totalPaise' }, orders: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: todayStart } } },
      { $group: { _id: null, salesPaise: { $sum: '$totalPaise' }, orders: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $addFields: { currentStatus: { $arrayElemAt: ['$statusHistory.status', -1] } } },
      { $match: { currentStatus: { $nin: TERMINAL } } },
      { $count: 'count' },
    ]),
    User.countDocuments({ role: 'customer' }),
    Order.find().sort('-createdAt').limit(8).lean({ virtuals: true }),
  ]);

  const recentOrders = recentRaw.map((o) => ({
    _id: o._id,
    orderNumber: o.orderNumber,
    totalPaise: o.totalPaise,
    status: o.statusHistory?.[o.statusHistory.length - 1]?.status,
    itemCount: o.items.reduce((n, it) => n + it.quantity, 0),
    createdAt: o.createdAt,
  }));

  return sendSuccess(res, {
    totalSalesPaise: allTime[0]?.salesPaise || 0,
    totalOrders: allTime[0]?.orders || 0,
    todaysOrders: today[0]?.orders || 0,
    todaysRevenuePaise: today[0]?.salesPaise || 0,
    pendingOrders: pendingAgg[0]?.count || 0,
    customerCount,
    recentOrders,
  });
});

// GET /api/admin/analytics — sales by day (14d), top products, status mix
export const analytics = asyncHandler(async (req, res) => {
  const since = new Date();
  since.setDate(since.getDate() - 13);
  since.setHours(0, 0, 0, 0);

  const [salesByDay, topProducts, statusDist] = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          salesPaise: { $sum: '$totalPaise' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productNameSnapshot',
          qty: { $sum: '$items.quantity' },
          revenuePaise: { $sum: '$items.lineTotalPaise' },
        },
      },
      { $sort: { qty: -1 } },
      { $limit: 5 },
    ]),
    Order.aggregate([
      { $addFields: { currentStatus: { $arrayElemAt: ['$statusHistory.status', -1] } } },
      { $group: { _id: '$currentStatus', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  return sendSuccess(res, {
    salesByDay: salesByDay.map((d) => ({ date: d._id, salesPaise: d.salesPaise, orders: d.orders })),
    topProducts: topProducts.map((p) => ({ name: p._id, qty: p.qty, revenuePaise: p.revenuePaise })),
    statusDistribution: statusDist.map((s) => ({ status: s._id, count: s.count })),
  });
});
