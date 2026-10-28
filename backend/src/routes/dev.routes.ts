import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middleware/auth.middleware';
import { rateLimit } from '../middleware/rateLimit.middleware';
import * as devController from '../controllers/dev.controller';

const router = Router();

router.post(
  '/reset-password',
  rateLimit({ windowMs: 60_000, max: 5 }),
  asyncHandler(devController.resetPassword)
);

router.use(authenticate);
router.post('/simulate-payment/:orderId', asyncHandler(devController.simulatePayment));

export default router;
