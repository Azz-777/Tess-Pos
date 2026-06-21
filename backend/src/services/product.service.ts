import { Types, PipelineStage } from 'mongoose';
import { ProductModel } from '../models/product.model';
import { CategoryModel } from '../models/category.model';
import { AppError } from '../utils/AppError';

interface SearchParams {
  tenantId: string;
  search: string;
  page: number;
  limit: number;
}

export async function searchProducts({ tenantId, search, page, limit }: SearchParams) {
  const match: Record<string, unknown> = { tenantId: new Types.ObjectId(tenantId) };
  if (search) {
    // Treat the search term as a literal substring: escape regex metacharacters so a
    // crafted input cannot change the query semantics or trigger catastrophic
    // backtracking (ReDoS). Cap the length as a second line of defence.
    const escaped = search.trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    match.name = { $regex: escaped, $options: 'i' };
  }

  const skip = (page - 1) * limit;

  const pipeline: PipelineStage[] = [
    { $match: match },
    { $sort: { name: 1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: 'categories',
        localField: 'categoryId',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        name: 1,
        sku: 1,
        price: 1,
        stock: 1,
        categoryName: '$category.name',
      },
    },
  ];

  const [items, total] = await Promise.all([
    ProductModel.aggregate(pipeline),
    ProductModel.countDocuments(match),
  ]);

  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

interface CreateProductInput {
  name: string;
  sku?: string;
  price: number;
  costPrice: number;
  stock: number;
  categoryId?: string;
  categoryName?: string;
}

export async function createProduct(tenantId: string, input: CreateProductInput) {
  const name = (input.name ?? '').trim();
  if (!name) {
    throw new AppError(400, 'Mahsulot nomi kiritilishi shart');
  }
  if (!(input.price >= 0)) {
    throw new AppError(400, 'Sotuv narxi noldan kichik bo‘lmasligi kerak');
  }
  if (!(input.costPrice >= 0)) {
    throw new AppError(400, 'Tannarx noldan kichik bo‘lmasligi kerak');
  }
  if (!Number.isInteger(input.stock) || input.stock < 0) {
    throw new AppError(400, 'Qoldiq manfiy bo‘lmagan butun son bo‘lishi kerak');
  }

  const tenantObjectId = new Types.ObjectId(tenantId);
  let categoryId: Types.ObjectId | undefined;

  if (input.categoryId) {
    if (!Types.ObjectId.isValid(input.categoryId)) {
      throw new AppError(400, 'Turkum noto‘g‘ri');
    }
    const category = await CategoryModel.findOne({ _id: input.categoryId, tenantId: tenantObjectId });
    if (!category) {
      throw new AppError(404, 'Turkum bu biznesda topilmadi');
    }
    categoryId = category._id;
  } else if (input.categoryName && input.categoryName.trim()) {
    const categoryName = input.categoryName.trim();
    let category = await CategoryModel.findOne({ tenantId: tenantObjectId, name: categoryName });
    if (!category) {
      try {
        category = await CategoryModel.create({ tenantId: tenantObjectId, name: categoryName });
      } catch (err) {
        // Lost the get-or-create race against a concurrent request: the unique
        // index rejected our insert, so re-read the row the winner created.
        if ((err as { code?: number }).code === 11000) {
          category = await CategoryModel.findOne({ tenantId: tenantObjectId, name: categoryName });
        } else {
          throw err;
        }
      }
    }
    categoryId = category?._id;
  }

  const product = await ProductModel.create({
    tenantId: tenantObjectId,
    name,
    sku: input.sku?.trim() || undefined,
    price: input.price,
    costPrice: input.costPrice,
    stock: input.stock,
    categoryId,
  });

  return {
    id: String(product._id),
    name: product.name,
    sku: product.sku,
    price: product.price,
    costPrice: product.costPrice,
    stock: product.stock,
  };
}

export async function listManagedProducts(tenantId: string) {
  const pipeline: PipelineStage[] = [
    { $match: { tenantId: new Types.ObjectId(tenantId) } },
    { $sort: { name: 1 } },
    {
      $lookup: {
        from: 'categories',
        localField: 'categoryId',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        name: 1,
        sku: 1,
        price: 1,
        costPrice: 1,
        stock: 1,
        categoryName: '$category.name',
        margin: { $subtract: ['$price', '$costPrice'] },
      },
    },
  ];
  return ProductModel.aggregate(pipeline);
}
