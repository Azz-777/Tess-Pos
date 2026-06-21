import { Request, Response } from 'express';
import { listTenants, createTenant, setTenantActive } from '../services/tenant.service';

export async function list(_req: Request, res: Response) {
  const items = await listTenants();
  res.json({ items });
}

export async function create(req: Request, res: Response) {
  const body = req.body ?? {};
  const tenant = await createTenant({
    name: body.name,
    businessType: body.businessType,
    adminName: body.adminName,
    adminEmail: body.adminEmail,
    adminPassword: body.adminPassword,
  });
  res.status(201).json(tenant);
}

export async function setActive(req: Request, res: Response) {
  const active = Boolean(req.body?.active);
  const tenant = await setTenantActive(req.params.id, active);
  res.json(tenant);
}
