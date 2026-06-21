import { Request, Response } from 'express';
import { isValidSignature } from '../utils/hmac';
import { processPaymentEvent } from '../services/webhook.service';
import { AppError } from '../utils/AppError';

export async function handlePaymentWebhook(req: Request, res: Response) {
  const raw = req.body;
  const signature = req.header('x-signature');

  if (!signature || !Buffer.isBuffer(raw) || !isValidSignature(raw, signature)) {
    throw new AppError(401, 'Invalid signature');
  }

  let payload: { eventId?: string; type?: string; orderId?: string; tenantId?: string };
  try {
    payload = JSON.parse(raw.toString('utf8'));
  } catch {
    throw new AppError(400, 'Invalid JSON body');
  }

  const result = await processPaymentEvent({
    eventId: payload.eventId ?? '',
    type: payload.type ?? 'payment.succeeded',
    orderId: payload.orderId ?? '',
    tenantId: payload.tenantId ?? '',
  });

  res.status(200).json({ received: true, ...result });
}
