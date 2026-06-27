import Redis from 'ioredis';
import { config } from '../config';

let redis: Redis;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: 0,
    });
  }
  return redis;
}

export async function setCache(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
  const redis = getRedis();
  await redis.setex(key, ttlSeconds, JSON.stringify(value));
}

export async function getCache<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  const data = await redis.get(key);
  if (!data) return null;
  try {
    return JSON.parse(data) as T;
  } catch {
    return data as unknown as T;
  }
}

export async function delCache(key: string): Promise<void> {
  const redis = getRedis();
  await redis.del(key);
}