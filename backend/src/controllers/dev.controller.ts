import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { OrderModel } from '../models/order.model';
import { processPaymentEvent } from '../services/webhook.service';
import { AppError } from '../utils/AppError';

export async function simulatePayment(req: Request, res: Response) {
  const orderId = req.params.orderId;
  if (!Types.ObjectId.isValid(orderId)) {
    throw new AppError(400, 'Buyurtma id noto‘g‘ri');
  }

  const order = await OrderModel.findOne({
    _id: orderId,
    tenantId: new Types.ObjectId(req.user!.tenantId!),
  });
  if (!order) {
    throw new AppError(404, 'Buyurtma topilmadi');
  }

  const eventId = `dev-${orderId}-${Date.now()}`;
  const result = await processPaymentEvent({
    eventId,
    type: 'payment.succeeded',
    orderId,
    tenantId: req.user!.tenantId!,
  });

  res.json({ simulated: true, eventId, ...result });
}
