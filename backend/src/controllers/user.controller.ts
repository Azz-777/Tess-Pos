import { Request, Response } from 'express';
import { listUsers, createUser, setUserActive, deleteUser } from '../services/user.service';

export async function list(req: Request, res: Response) {
  const items = await listUsers(req.user!.tenantId!);
  res.json({ items });
}

export async function create(req: Request, res: Response) {
  const body = req.body ?? {};
  const user = await createUser(req.user!.tenantId!, {
    name: body.name,
    email: body.email,
    password: body.password,
    role: body.role,
  });
  res.status(201).json(user);
}

export async function setActive(req: Request, res: Response) {
  const active = Boolean(req.body?.active);
  const user = await setUserActive(req.user!.tenantId!, req.params.id, active, req.user!.userId);
  res.json(user);
}

export async function remove(req: Request, res: Response) {
  const result = await deleteUser(req.user!.tenantId!, req.params.id, req.user!.userId);
  res.json(result);
}
