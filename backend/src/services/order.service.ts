import mongoose, { Types, HydratedDocument } from 'mongoose';
import { ProductModel } from '../models/product.model';
import { OrderModel, Order } from '../models/order.model';
import { AppError } from '../utils/AppError';

interface CartItemInput {
  productId: string;
  quantity: number;
}

interface ReceiptItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

interface Receipt {
  id: string;
  status: string;
  total: number;
  createdAt: Date;
  items: ReceiptItem[];
}

function toReceipt(order: HydratedDocument<Order>): Receipt {
  return {
    id: String(order._id),
    status: order.status,
    total: order.total,
    createdAt: order.createdAt as Date,
    items: order.items.map((line) => ({
      productId: String(line.productId),
      name: line.name,
      unitPrice: line.unitPrice,
      quantity: line.quantity,
      lineTotal: line.lineTotal,
    })),
  };
}

export async function placeOrder(tenantId: string, userId: string, items: CartItemInput[]): Promise<Receipt> {
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError(400, 'Savat bo‘sh');
  }

  const quantities = new Map<string, number>();
  for (const item of items) {
    if (!item.productId || !Types.ObjectId.isValid(item.productId)) {
      throw new AppError(400, 'Har bir savat elementi to‘g‘ri productId talab qiladi');
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new AppError(400, 'Har bir element uchun musbat butun son (soni) talab qilinadi');
    }
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  }

  const tenantObjectId = new Types.ObjectId(tenantId);
  const session = await mongoose.startSession();

  try {
    let createdOrder: HydratedDocument<Order> | null = null;

    await session.withTransaction(async () => {
      const ids = [...quantities.keys()].map((id) => new Types.ObjectId(id));
      const products = await ProductModel.find({ _id: { $in: ids }, tenantId: tenantObjectId })
        .select('+costPrice')
        .session(session);
      const productMap = new Map(products.map((product) => [String(product._id), product]));

      const lineItems = [];
      for (const [productId, quantity] of quantities) {
        const product = productMap.get(productId);
        if (!product) {
          throw new AppError(404, `Mahsulot ${productId} bu biznesda topilmadi`);
        }

        const result = await ProductModel.updateOne(
          { _id: product._id, tenantId: tenantObjectId, stock: { $gte: quantity } },
          { $inc: { stock: -quantity } },
          { session }
        );

        if (result.matchedCount === 0) {
          throw new AppError(409, `${product.name} uchun qoldiq yetarli emas`);
        }

        lineItems.push({
          productId: product._id,
          name: product.name,
          unitPrice: product.price,
          unitCost: product.costPrice,
          quantity,
          lineTotal: product.price * quantity,
        });
      }

      const total = lineItems.reduce((sum, line) => sum + line.lineTotal, 0);

      const created = await OrderModel.create(
        [
          {
            tenantId: tenantObjectId,
            items: lineItems,
            total,
            status: 'pending_payment',
            createdBy: new Types.ObjectId(userId),
          },
        ],
        { session }
      );
      createdOrder = created[0];
    });

    return toReceipt(createdOrder!);
  } finally {
    await session.endSession();
  }
}

export async function getOrder(tenantId: string, orderId: string): Promise<Receipt> {
  if (!Types.ObjectId.isValid(orderId)) {
    throw new AppError(400, 'Buyurtma id noto‘g‘ri');
  }
  const order = await OrderModel.findOne({
    _id: orderId,
    tenantId: new Types.ObjectId(tenantId),
  });
  if (!order) {
    throw new AppError(404, 'Buyurtma topilmadi');
  }
  return toReceipt(order);
}

export async function listOrders(tenantId: string): Promise<Receipt[]> {
  const orders = await OrderModel.find({ tenantId: new Types.ObjectId(tenantId) })
    .sort({ createdAt: -1 })
    .limit(50);
  return orders.map(toReceipt);
}
