import { Request, Response } from 'express';
import { placeOrder, getOrder, listOrders } from '../services/order.service';

export async function create(req: Request, res: Response) {
  const items = req.body?.items;
  const receipt = await placeOrder(req.user!.tenantId!, req.user!.userId, items);
  res.status(201).json(receipt);
}

export async function getById(req: Request, res: Response) {
  const receipt = await getOrder(req.user!.tenantId!, req.params.id);
  res.json(receipt);
}

export async function list(req: Request, res: Response) {
  const orders = await listOrders(req.user!.tenantId!);
  res.json({ items: orders });
}
