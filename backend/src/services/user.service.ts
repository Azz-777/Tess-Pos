import { Types } from 'mongoose';
import { UserModel } from '../models/user.model';
import { hashPassword } from '../utils/password';
import { AppError } from '../utils/AppError';

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: string;
}

function toUser(user: { _id: unknown; name: string; email: string; role: string; active?: boolean }) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active !== false,
  };
}

export async function listUsers(tenantId: string) {
  const users = await UserModel.find({ tenantId: new Types.ObjectId(tenantId) }).sort({ createdAt: 1 });
  return users.map(toUser);
}

export async function createUser(tenantId: string, input: CreateUserInput) {
  const name = (input.name ?? '').trim();
  const email = (input.email ?? '').trim().toLowerCase();

  if (!name) {
    throw new AppError(400, 'Ism kiritilishi shart');
  }
  if (!email) {
    throw new AppError(400, 'Email kiritilishi shart');
  }
  if (!input.password || input.password.length < 6) {
    throw new AppError(400, 'Parol kamida 6 ta belgi bo‘lishi kerak');
  }
  if (input.role !== 'admin' && input.role !== 'cashier') {
    throw new AppError(400, 'Rol admin yoki kassir bo‘lishi kerak');
  }

  const passwordHash = await hashPassword(input.password);

  try {
    const user = await UserModel.create({
      tenantId: new Types.ObjectId(tenantId),
      name,
      email,
      passwordHash,
      role: input.role,
    });
    return toUser(user);
  } catch (err) {
    if (err && typeof err === 'object' && (err as { code?: number }).code === 11000) {
      throw new AppError(409, 'Bu email bilan foydalanuvchi allaqachon mavjud');
    }
    throw err;
  }
}

export async function setUserActive(
  tenantId: string,
  userId: string,
  active: boolean,
  requestingUserId: string
) {
  if (!Types.ObjectId.isValid(userId)) {
    throw new AppError(400, 'Foydalanuvchi id noto‘g‘ri');
  }
  if (userId === requestingUserId && !active) {
    throw new AppError(400, 'O‘z hisobingizni bloklay olmaysiz');
  }
  const user = await UserModel.findOneAndUpdate(
    { _id: userId, tenantId: new Types.ObjectId(tenantId) },
    { active },
    { new: true }
  );
  if (!user) {
    throw new AppError(404, 'Foydalanuvchi topilmadi');
  }
  return toUser(user);
}

export async function deleteUser(tenantId: string, userId: string, requestingUserId: string) {
  if (!Types.ObjectId.isValid(userId)) {
    throw new AppError(400, 'Foydalanuvchi id noto‘g‘ri');
  }
  if (userId === requestingUserId) {
    throw new AppError(400, 'O‘z hisobingizni o‘chira olmaysiz');
  }
  const user = await UserModel.findOneAndDelete({
    _id: userId,
    tenantId: new Types.ObjectId(tenantId),
  });
  if (!user) {
    throw new AppError(404, 'Foydalanuvchi topilmadi');
  }
  return { id: userId };
}
