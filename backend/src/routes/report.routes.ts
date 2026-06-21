import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/requireRole.middleware';
import * as reportController from '../controllers/report.controller';

const router = Router();

router.use(authenticate);
router.get('/sales', requireRole('admin'), asyncHandler(reportController.sales));

export default router;
