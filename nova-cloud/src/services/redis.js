let redisClient = null;
let redisFailed = false;

async function getRedis() {
  if (redisFailed) return null;
  if (redisClient?.isOpen) return redisClient;
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const { createClient } = require('redis');
    redisClient = createClient({
      url: redisUrl,
      socket: { connectTimeout: 1500, reconnectStrategy: false }
    });
    redisClient.on('error', () => {});
    await Promise.race([
      redisClient.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('redis timeout')), 2000))
    ]);
    return redisClient;
  } catch {
    redisFailed = true;
    redisClient = null;
    return null;
  }
}

async function cacheGet(key) {
  const r = await getRedis();
  if (!r) return null;
  try {
    const val = await r.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

async function cacheSet(key, value, ttlSec = 3600) {
  const r = await getRedis();
  if (!r) return false;
  try {
    await r.setEx(key, ttlSec, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

module.exports = { cacheGet, cacheSet };
