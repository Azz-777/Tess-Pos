import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import { UserModel } from '../models/user.model';
import { TenantModel } from '../models/tenant.model';

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new AppError(401, 'Avtorizatsiya talab qilinadi');
    }

    const token = header.slice('Bearer '.length);
    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw new AppError(401, 'Token noto‘g‘ri yoki muddati o‘tgan');
    }

    const user = await UserModel.findById(payload.userId).lean();
    if (!user || user.active === false) {
      throw new AppError(401, 'Hisob faol emas');
    }

    if (user.role === 'superadmin') {
      req.user = { userId: String(user._id), tenantId: null, role: 'superadmin' };
      return next();
    }

    if (!user.tenantId) {
      throw new AppError(401, 'Foydalanuvchi biznesga bog‘lanmagan');
    }

    const tenant = await TenantModel.findById(user.tenantId).lean();
    if (!tenant || tenant.active === false) {
      throw new AppError(401, 'Bu biznes to‘xtatilgan yoki mavjud emas');
    }

    req.user = {
      userId: String(user._id),
      tenantId: String(user.tenantId),
      role: user.role as 'admin' | 'cashier',
    };
    next();
  } catch (err) {
    next(err);
  }
}
