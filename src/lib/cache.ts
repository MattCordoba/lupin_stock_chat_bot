// Simple in-memory TTL cache for API routes
// Note: In Vercel serverless, this cache is per-function-instance

import { CacheEntry } from "./types";

const cache = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache<T>(key: string, data: T, ttlSeconds: number): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export function clearCache(keyPrefix?: string): void {
  if (keyPrefix) {
    Array.from(cache.keys()).forEach((key) => {
      if (key.startsWith(keyPrefix)) {
        cache.delete(key);
      }
    });
  } else {
    cache.clear();
  }
}

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  STOCKTWITS_TRENDING: 60, // 1 minute
  STOCKTWITS_SENTIMENT: 120, // 2 minutes
  NEWS_SENTIMENT: 300, // 5 minutes
  HYPE_SCORE: 120, // 2 minutes
} as const;
