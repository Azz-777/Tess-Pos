import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

interface Bucket {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  windowMs: number;
  max: number;
}

// Minimal fixed-window rate limiter, in-process and dependency-free. Enough to
// blunt password brute-forcing on /auth/login. The API is called by the browser
// directly (no proxy in front), so req.ip is the real client. In a multi-instance
// deployment this would move to a shared store (Redis) so the window is global;
// the same caveat applies as to the report cache.
export function rateLimit({ windowMs, max }: RateLimitOptions) {
  const buckets = new Map<string, Bucket>();

  return (req: Request, _res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = req.ip ?? 'unknown';

    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;
    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      return next(new AppError(429, `Too many attempts. Try again in ${retryAfter}s.`));
    }

    // Opportunistic cleanup so idle clients don't accumulate forever.
    if (buckets.size > 10_000) {
      for (const [k, b] of buckets) {
        if (b.resetAt <= now) {
          buckets.delete(k);
        }
      }
    }

    next();
  };
}
