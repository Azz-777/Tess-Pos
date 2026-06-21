import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/requireRole.middleware';
import * as productController from '../controllers/product.controller';

const router = Router();

router.use(authenticate);
router.get('/', requireRole('admin', 'cashier'), asyncHandler(productController.search));
router.get('/manage', requireRole('admin'), asyncHandler(productController.listManaged));
router.post('/', requireRole('admin'), asyncHandler(productController.create));

export default router;
