import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/requireRole.middleware';
import * as tenantController from '../controllers/tenant.controller';

const router = Router();

router.use(authenticate);
router.get('/', requireRole('superadmin'), asyncHandler(tenantController.list));
router.post('/', requireRole('superadmin'), asyncHandler(tenantController.create));
router.patch('/:id', requireRole('superadmin'), asyncHandler(tenantController.setActive));

export default router;
