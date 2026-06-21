import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

type Role = 'superadmin' | 'admin' | 'cashier';

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError(403, 'Sizda bu amalga ruxsat yo‘q'));
    }
    next();
  };
}
