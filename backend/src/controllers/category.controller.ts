import { Request, Response } from 'express';
import { listCategories } from '../services/category.service';

export async function list(req: Request, res: Response) {
  const items = await listCategories(req.user!.tenantId!);
  res.json({ items });
}
