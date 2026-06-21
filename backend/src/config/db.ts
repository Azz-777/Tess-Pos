import mongoose from 'mongoose';
import { env } from './env';

export async function connectDatabase(): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri);
}

export async function connectWithRetry(attempts = 10, delayMs = 3000): Promise<void> {
  for (let i = 1; i <= attempts; i++) {
    try {
      await connectDatabase();
      console.log('Connected to MongoDB');
      return;
    } catch (err) {
      console.log(`MongoDB connection attempt ${i}/${attempts} failed, retrying in ${delayMs}ms`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error('Could not connect to MongoDB');
}
