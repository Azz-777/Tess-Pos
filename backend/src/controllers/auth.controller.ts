import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { AppError } from '../utils/AppError';

export async function login(req: Request, res: Response) {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    throw new AppError(400, 'Email va parol kiritilishi shart');
  }
  const result = await authService.login(email, password);
  res.json(result);
}
