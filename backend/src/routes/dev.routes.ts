import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middleware/auth.middleware';
import * as devController from '../controllers/dev.controller';

const router = Router();

router.use(authenticate);
router.post('/simulate-payment/:orderId', asyncHandler(devController.simulatePayment));

export default router;
