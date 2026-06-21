import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import categoryRoutes from './routes/category.routes';
import orderRoutes from './routes/order.routes';
import webhookRoutes from './routes/webhook.routes';
import reportRoutes from './routes/report.routes';
import userRoutes from './routes/user.routes';
import tenantRoutes from './routes/tenant.routes';
import devRoutes from './routes/dev.routes';
import { notFound, errorHandler } from './middleware/error.middleware';

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(',') }));

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/api/webhooks', express.raw({ type: '*/*' }), webhookRoutes);

  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/tenants', tenantRoutes);
  if (env.enableDevRoutes) {
    app.use('/api/dev', devRoutes);
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
