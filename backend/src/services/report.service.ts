import { Types, PipelineStage } from 'mongoose';
import { OrderModel } from '../models/order.model';
import { buildKey, getCached, setCached } from '../cache/reportCache';
import { AppError } from '../utils/AppError';

interface ReportParams {
  tenantId: string;
  from?: string;
  to?: string;
}

interface SummaryRow {
  totalRevenue: number;
  totalMargin: number;
  itemsSold: number;
}

export async function getSalesReport({ tenantId, from, to }: ReportParams) {
  const parseDate = (value: string, field: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new AppError(400, `${field} sanasi noto‘g‘ri`);
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(value) && date.toISOString().slice(0, 10) !== value) {
      throw new AppError(400, `${field} sanasi noto‘g‘ri`);
    }
    return date;
  };

  const fromDate = from ? parseDate(from, 'Boshlanish') : new Date('1970-01-01T00:00:00.000Z');
  const toDate = to ? parseDate(to, 'Tugash') : new Date();
  const toExclusive = to ? new Date(toDate) : toDate;
  if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
    toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);
  }
  if (fromDate >= toExclusive) {
    throw new AppError(400, 'Boshlanish sanasi tugash sanasidan keyin bo‘lishi mumkin emas');
  }

  const key = buildKey(tenantId, from ?? '', to ?? '');
  const cached = getCached(key);
  if (cached) {
    return { ...(cached as object), cached: true };
  }

  const pipeline: PipelineStage[] = [
    {
      $match: {
        tenantId: new Types.ObjectId(tenantId),
        status: 'paid',
        createdAt: to ? { $gte: fromDate, $lt: toExclusive } : { $gte: fromDate, $lte: toDate },
      },
    },
    {
      $facet: {
        summary: [
          { $unwind: '$items' },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: { $multiply: ['$items.unitPrice', '$items.quantity'] } },
              totalMargin: {
                $sum: {
                  $multiply: [
                    { $subtract: ['$items.unitPrice', '$items.unitCost'] },
                    '$items.quantity',
                  ],
                },
              },
              itemsSold: { $sum: '$items.quantity' },
            },
          },
        ],
        topProducts: [
          { $unwind: '$items' },
          {
            $group: {
              _id: '$items.productId',
              name: { $first: '$items.name' },
              quantity: { $sum: '$items.quantity' },
              revenue: { $sum: { $multiply: ['$items.unitPrice', '$items.quantity'] } },
            },
          },
          { $sort: { quantity: -1 } },
          { $limit: 5 },
          { $project: { _id: 0, productId: '$_id', name: 1, quantity: 1, revenue: 1 } },
        ],
        orderCount: [{ $count: 'count' }],
      },
    },
  ];

  const result = await OrderModel.aggregate(pipeline);
  const facet = result[0] as {
    summary: SummaryRow[];
    topProducts: unknown[];
    orderCount: { count: number }[];
  };

  const summary = facet.summary[0] ?? { totalRevenue: 0, totalMargin: 0, itemsSold: 0 };

  const report = {
    from: fromDate.toISOString(),
    to: toDate.toISOString(),
    totalRevenue: summary.totalRevenue,
    totalMargin: summary.totalMargin,
    itemsSold: summary.itemsSold,
    orderCount: facet.orderCount[0]?.count ?? 0,
    topProducts: facet.topProducts,
    cached: false,
  };

  setCached(key, report);
  return report;
}
