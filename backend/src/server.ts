import mongoose from 'mongoose';
import { createApp } from './app';
import { connectWithRetry } from './config/db';
import { env } from './config/env';
import { seedIfEmpty } from './seed';

async function start() {
  await connectWithRetry();

  if (env.seedOnStart) {
    await seedIfEmpty();
  }

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`Tess POS API listening on port ${env.port}`);
  });

  // Stop accepting new connections, then close the DB, so an in-flight order
  // transaction is not torn off mid-commit on container restart/deploy.
  const shutdown = (signal: string) => {
    console.log(`${signal} received, shutting down gracefully`);
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
    // Failsafe: don't hang forever if a connection never drains.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
