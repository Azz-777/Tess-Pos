import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  mongoUri: required('MONGODB_URI'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '12h',
  webhookSecret: required('PAYMENT_WEBHOOK_SECRET'),
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  enableDevRoutes: (process.env.ENABLE_DEV_ROUTES ?? 'false') === 'true',
  seedOnStart: (process.env.SEED_ON_START ?? 'false') === 'true',
};
