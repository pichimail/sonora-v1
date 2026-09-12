import { Redis } from '@upstash/redis';

let cachedRedis: Redis | null | undefined;

function getRedis() {
  if (cachedRedis !== undefined) return cachedRedis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  cachedRedis = url && token ? new Redis({ url, token }) : null;
  return cachedRedis;
}

export function rateLimitBucketKey(scope: string, identity: string, windowSeconds: number, nowMs = Date.now()) {
  const bucket = Math.floor(nowMs / 1000 / windowSeconds);
  return `sonora:rl:${scope}:${identity}:${bucket}`;
}

export async function rateLimit(scope: string, identity: string, limit: number, windowSeconds: number) {
  const redis = getRedis();
  if (!redis) return { allowed: true, configured: false, remaining: limit };

  try {
    const key = rateLimitBucketKey(scope, identity, windowSeconds);
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, windowSeconds + 5);
    return {
      allowed: count <= limit,
      configured: true,
      remaining: Math.max(0, limit - count),
    };
  } catch (error) {
    return {
      allowed: true,
      configured: true,
      remaining: limit,
      error: error instanceof Error ? error.message : 'Redis rate-limit check failed',
    };
  }
}

export async function checkRedis() {
  const redis = getRedis();
  if (!redis) return { configured: false, ok: false };
  try {
    const result = await redis.ping();
    return { configured: true, ok: result === 'PONG' };
  } catch (error) {
    return {
      configured: true,
      ok: false,
      error: error instanceof Error ? error.message : 'Redis check failed',
    };
  }
}
