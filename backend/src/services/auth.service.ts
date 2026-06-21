import { UserModel } from '../models/user.model';
import { TenantModel } from '../models/tenant.model';
import { verifyPassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';

export async function login(email: string, password: string) {
  const user = await UserModel.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) {
    throw new AppError(401, 'Email yoki parol noto‘g‘ri');
  }
  if (user.active === false) {
    throw new AppError(403, 'Bu hisob bloklangan');
  }

  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk) {
    throw new AppError(401, 'Email yoki parol noto‘g‘ri');
  }

  const tenantId = user.tenantId ? String(user.tenantId) : null;

  const token = signToken({
    userId: String(user._id),
    tenantId,
    role: user.role as 'superadmin' | 'admin' | 'cashier',
  });

  const tenant = user.tenantId ? await TenantModel.findById(user.tenantId).lean() : null;

  return {
    token,
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId,
    },
    tenant: tenant
      ? { id: String(tenant._id), name: tenant.name, businessType: tenant.businessType }
      : null,
  };
}
