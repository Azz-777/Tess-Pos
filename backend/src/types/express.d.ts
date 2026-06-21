import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        tenantId: string | null;
        role: 'superadmin' | 'admin' | 'cashier';
      };
    }
  }
}

export {};
