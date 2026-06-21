import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: 'Manzil topilmadi' });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: 'Server xatosi' });
}
