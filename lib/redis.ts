import Redis from "ioredis";
import { getEnv } from "./env";

let redis: Redis | null = null;

/**
 * Get Redis connection instance
 * Uses singleton pattern to reuse connection
 */
export function getRedis(): Redis {
  if (redis) {
    return redis;
  }

  const env = getEnv();

  if (!env.REDIS_URL) {
    throw new Error("REDIS_URL is required for background jobs");
  }

  redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false,
    lazyConnect: true,
  });

  redis.on("error", (err) => {
    console.error("[Redis] Connection error:", err.message);
  });

  redis.on("connect", () => {
    console.log("[Redis] Connected successfully");
  });

  return redis;
}

/**
 * BullMQ connection options
 */
export function getRedisConnection() {
  return {
    connection: getRedis(),
  };
}

/**
 * Check if Redis is available
 */
export async function isRedisAvailable(): Promise<boolean> {
  try {
    const env = getEnv();
    if (!env.REDIS_URL) {
      return false;
    }

    const r = getRedis();
    await r.ping();
    return true;
  } catch {
    return false;
  }
}

/**
 * Close Redis connection gracefully
 */
export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
