import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/requireRole.middleware';
import * as userController from '../controllers/user.controller';

const router = Router();

router.use(authenticate);
router.get('/', requireRole('admin'), asyncHandler(userController.list));
router.post('/', requireRole('admin'), asyncHandler(userController.create));
router.patch('/:id', requireRole('admin'), asyncHandler(userController.setActive));
router.delete('/:id', requireRole('admin'), asyncHandler(userController.remove));

export default router;
