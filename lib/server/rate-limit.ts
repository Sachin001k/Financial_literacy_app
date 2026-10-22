import 'server-only';
import { ApiError } from './http';

// In-memory sliding window. Good for a single instance; swap for Upstash/Redis when scaling out.
const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs = 60_000) {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= limit) throw new ApiError(429, 'RATE_LIMITED', 'Too many requests, slow down a little.');
  list.push(now);
  hits.set(key, list);
}

export const clientIp = (req: Request) => req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
