import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { rateLimit } from '../middleware/rateLimit.middleware';
import * as authController from '../controllers/auth.controller';

const router = Router();

// Cap login attempts per client to slow credential stuffing / brute force.
const loginLimiter = rateLimit({ windowMs: 60_000, max: 10 });

router.post('/login', loginLimiter, asyncHandler(authController.login));

export default router;
