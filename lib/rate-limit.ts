import 'server-only';

import { type Duration, Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

function makeLimiter(requests: number, window: Duration) {
  if (!url || !token) return null;
  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: true,
  });
}

/** IP당 분당 5회 (ROADMAP Phase 1) */
export const ratelimitPerMinute = makeLimiter(5, '1 m');

/** IP당 일 50회 (ROADMAP Phase 1) */
export const ratelimitPerDay = makeLimiter(50, '1 d');
