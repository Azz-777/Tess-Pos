import { Types } from 'mongoose';
import { CategoryModel } from '../models/category.model';

export async function listCategories(tenantId: string) {
  const categories = await CategoryModel.find({ tenantId: new Types.ObjectId(tenantId) }).sort({ name: 1 });
  return categories.map((category) => ({ id: String(category._id), name: category.name }));
}
