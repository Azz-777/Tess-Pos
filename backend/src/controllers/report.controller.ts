import { Request, Response } from 'express';
import { getSalesReport } from '../services/report.service';

export async function sales(req: Request, res: Response) {
  const from = typeof req.query.from === 'string' ? req.query.from : undefined;
  const to = typeof req.query.to === 'string' ? req.query.to : undefined;

  const report = await getSalesReport({ tenantId: req.user!.tenantId!, from, to });
  res.json(report);
}
