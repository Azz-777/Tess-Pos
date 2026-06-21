import { Types } from 'mongoose';
import { TenantModel } from '../models/tenant.model';
import { UserModel } from '../models/user.model';
import { ProductModel } from '../models/product.model';
import { hashPassword } from '../utils/password';
import { AppError } from '../utils/AppError';

interface CreateTenantInput {
  name: string;
  businessType: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

export async function listTenants() {
  const tenants = await TenantModel.find().sort({ createdAt: 1 }).lean();

  return Promise.all(
    tenants.map(async (tenant) => {
      const [userCount, productCount] = await Promise.all([
        UserModel.countDocuments({ tenantId: tenant._id }),
        ProductModel.countDocuments({ tenantId: tenant._id }),
      ]);
      return {
        id: String(tenant._id),
        name: tenant.name,
        businessType: tenant.businessType,
        active: tenant.active !== false,
        userCount,
        productCount,
      };
    })
  );
}

export async function createTenant(input: CreateTenantInput) {
  const name = (input.name ?? '').trim();
  const businessType = (input.businessType ?? '').trim() || 'Retail';
  const adminName = (input.adminName ?? '').trim();
  const adminEmail = (input.adminEmail ?? '').trim().toLowerCase();

  if (!name) {
    throw new AppError(400, 'Biznes nomi kiritilishi shart');
  }
  if (!adminName) {
    throw new AppError(400, 'Admin ismi kiritilishi shart');
  }
  if (!adminEmail) {
    throw new AppError(400, 'Admin email kiritilishi shart');
  }
  if (!input.adminPassword || input.adminPassword.length < 6) {
    throw new AppError(400, 'Admin paroli kamida 6 ta belgi bo‘lishi kerak');
  }

  const tenant = await TenantModel.create({ name, businessType });
  const passwordHash = await hashPassword(input.adminPassword);

  try {
    await UserModel.create({
      tenantId: tenant._id,
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: 'admin',
    });
  } catch (err) {
    await TenantModel.deleteOne({ _id: tenant._id });
    if (err && typeof err === 'object' && (err as { code?: number }).code === 11000) {
      throw new AppError(409, 'Bu email bilan foydalanuvchi allaqachon mavjud');
    }
    throw err;
  }

  return {
    id: String(tenant._id),
    name: tenant.name,
    businessType: tenant.businessType,
    active: true,
    adminEmail,
  };
}

export async function setTenantActive(tenantId: string, active: boolean) {
  if (!Types.ObjectId.isValid(tenantId)) {
    throw new AppError(400, 'Biznes id noto‘g‘ri');
  }
  const tenant = await TenantModel.findByIdAndUpdate(tenantId, { active }, { new: true });
  if (!tenant) {
    throw new AppError(404, 'Biznes topilmadi');
  }
  return {
    id: String(tenant._id),
    name: tenant.name,
    businessType: tenant.businessType,
    active: tenant.active !== false,
  };
}
