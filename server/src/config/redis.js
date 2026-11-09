import Redis from 'ioredis';

let redisClient = null;

try {
  redisClient = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) return null;
      return Math.min(times * 100, 1000);
    },
    lazyConnect: true
  });

  redisClient.connect().catch((err) => {
    console.warn('[Redis] Connection skipped or unavailable (falling back to direct DB):', err.message);
    redisClient = null;
  });

  redisClient.on('error', (err) => {
    // Suppress unhandled redis connection errors
  });
} catch (e) {
  redisClient = null;
}

export const getRedisClient = () => redisClient;

export const cacheGet = async (key) => {
  if (!redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const cacheSet = async (key, value, ttlSeconds = 15) => {
  if (!redisClient) return;
  try {
    await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {}
};

export const cacheDel = async (keyPattern) => {
  if (!redisClient) return;
  try {
    if (keyPattern.includes('*')) {
      const keys = await redisClient.keys(keyPattern);
      if (keys.length > 0) await redisClient.del(...keys);
    } else {
      await redisClient.del(keyPattern);
    }
  } catch {}
};

export default redisClient;
