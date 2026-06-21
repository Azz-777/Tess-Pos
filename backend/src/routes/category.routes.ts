import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/requireRole.middleware';
import * as categoryController from '../controllers/category.controller';

const router = Router();

router.use(authenticate);
router.get('/', requireRole('admin', 'cashier'), asyncHandler(categoryController.list));

export default router;
