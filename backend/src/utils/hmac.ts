import crypto from 'crypto';
import { env } from '../config/env';

export function computeSignature(rawBody: Buffer): string {
  return crypto.createHmac('sha256', env.webhookSecret).update(rawBody).digest('hex');
}

export function isValidSignature(rawBody: Buffer, signature: string): boolean {
  const expected = computeSignature(rawBody);
  const expectedBuffer = Buffer.from(expected, 'hex');
  let providedBuffer: Buffer;
  try {
    providedBuffer = Buffer.from(signature, 'hex');
  } catch {
    return false;
  }
  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}
