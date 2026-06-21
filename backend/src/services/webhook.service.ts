import mongoose, { Types } from 'mongoose';
import { OrderModel } from '../models/order.model';
import { WebhookEventModel } from '../models/webhookEvent.model';
import { AppError } from '../utils/AppError';
import { invalidateTenant } from '../cache/reportCache';

interface PaymentEvent {
  eventId: string;
  type: string;
  orderId: string;
  tenantId: string;
}

export async function processPaymentEvent(event: PaymentEvent) {
  const { eventId, orderId, tenantId } = event;
  const type = event.type || 'payment.succeeded';

  if (!eventId || !orderId || !tenantId) {
    throw new AppError(400, 'eventId, orderId and tenantId are required');
  }
  if (type !== 'payment.succeeded') {
    return { status: 'ignored' };
  }
  if (!Types.ObjectId.isValid(orderId) || !Types.ObjectId.isValid(tenantId)) {
    throw new AppError(400, 'Invalid orderId or tenantId');
  }

  const alreadyProcessed = await WebhookEventModel.findOne({ eventId }).lean();
  if (alreadyProcessed) {
    return { status: 'duplicate' };
  }

  const tenantObjectId = new Types.ObjectId(tenantId);
  const session = await mongoose.startSession();

  try {
    let outcome = 'processed';

    await session.withTransaction(async () => {
      const order = await OrderModel.findOne({ _id: orderId, tenantId: tenantObjectId }).session(session);
      if (!order) {
        throw new AppError(404, 'Order not found for this tenant');
      }

      await WebhookEventModel.create(
        [{ eventId, orderId: order._id, tenantId: order.tenantId, type }],
        { session }
      );

      if (order.status === 'paid') {
        outcome = 'already_paid';
        return;
      }
      if (order.status !== 'pending_payment') {
        throw new AppError(409, `Order is in state ${order.status} and cannot be paid`);
      }

      order.status = 'paid';
      order.paymentEventId = eventId;
      await order.save({ session });
    });

    invalidateTenant(tenantId);
    return { status: outcome };
  } catch (err) {
    if (err && typeof err === 'object' && (err as { code?: number }).code === 11000) {
      return { status: 'duplicate' };
    }
    throw err;
  } finally {
    await session.endSession();
  }
}
