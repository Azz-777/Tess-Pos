import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { OrderModel } from '../models/order.model';
import { UserModel } from '../models/user.model';
import { processPaymentEvent } from '../services/webhook.service';
import { AppError } from '../utils/AppError';
import { hashPassword } from '../utils/password';

const DEMO_ACCOUNT_EMAILS = new Set([
  'owner@tesspos.test',
  'admin@brightmart.test',
  'cashier@brightmart.test',
  'admin@citypharma.test',
  'cashier@citypharma.test',
  'admin@aromacafe.test',
  'cashier@aromacafe.test',
]);

export async function resetPassword(req: Request, res: Response) {
  if (process.env.NODE_ENV === 'production') {
    throw new AppError(404, 'Manzil topilmadi');
  }

  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new AppError(400, 'Email va yangi parol kiritilishi shart');
  }
  if (password.length < 6 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new AppError(400, 'Parol 6–72 bayt oralig‘ida bo‘lishi kerak');
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new AppError(400, 'Email kiritilishi shart');
  }

  const user = DEMO_ACCOUNT_EMAILS.has(normalizedEmail)
    ? await UserModel.findOne({ email: normalizedEmail }).select('+passwordHash')
    : null;
  if (user) {
    user.passwordHash = await hashPassword(password);
    await user.save();
  }

  res.json({ message: 'Agar bu email hisobga tegishli bo‘lsa, parol yangilandi.' });
}

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
