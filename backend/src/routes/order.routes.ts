import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/requireRole.middleware';
import * as orderController from '../controllers/order.controller';

const router = Router();

router.use(authenticate);
router.post('/', requireRole('cashier', 'admin'), asyncHandler(orderController.create));
router.get('/', requireRole('cashier', 'admin'), asyncHandler(orderController.list));
router.get('/:id', requireRole('cashier', 'admin'), asyncHandler(orderController.getById));

export default router;
