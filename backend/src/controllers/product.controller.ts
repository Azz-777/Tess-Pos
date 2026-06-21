import { Request, Response } from 'express';
import { searchProducts, createProduct, listManagedProducts } from '../services/product.service';

export async function search(req: Request, res: Response) {
  const searchTerm = typeof req.query.search === 'string' ? req.query.search : '';
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

  const result = await searchProducts({
    tenantId: req.user!.tenantId!,
    search: searchTerm,
    page,
    limit,
  });

  res.json(result);
}

export async function create(req: Request, res: Response) {
  const body = req.body ?? {};
  const product = await createProduct(req.user!.tenantId!, {
    name: body.name,
    sku: body.sku,
    price: Number(body.price),
    costPrice: Number(body.costPrice),
    stock: Number(body.stock),
    categoryId: body.categoryId || undefined,
    categoryName: body.categoryName || undefined,
  });
  res.status(201).json(product);
}

export async function listManaged(req: Request, res: Response) {
  const items = await listManagedProducts(req.user!.tenantId!);
  res.json({ items });
}
