import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { handlePaymentWebhook } from '../controllers/webhook.controller';

const router = Router();

router.post('/payment', asyncHandler(handlePaymentWebhook));

export default router;
