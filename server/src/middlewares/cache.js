let redisClient = null;

// Lazy-load Redis so a missing Redis server never crashes the app
try {
  redisClient = require('../config/redis');
} catch (e) { /* Redis not available */ }

const isRedisReady = () => redisClient && redisClient.isReady;

/**
 * Express middleware to cache API responses using Redis.
 * Falls back to no-cache if Redis is unavailable.
 * @param {number} duration - Cache duration in seconds.
 */
const cache = (duration = 300) => {
  return async (req, res, next) => {
    // Only cache GET requests & only when Redis is up
    if (req.method !== 'GET' || !isRedisReady()) {
      return next();
    }

    const key = `cache:${req.originalUrl || req.url}`;

    try {
      const cached = await redisClient.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      // Intercept res.json to store the response
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (res.statusCode >= 200 && res.statusCode < 300 && isRedisReady()) {
          redisClient.setEx(key, duration, JSON.stringify(body)).catch(() => {});
        }
        originalJson(body);
      };
      next();
    } catch (error) {
      // If Redis has any error, just skip caching and serve normally
      next();
    }
  };
};

/**
 * Clear cached keys matching a pattern prefix.
 */
const clearCache = async (pattern) => {
  try {
    if (!isRedisReady()) return;
    const keys = await redisClient.keys(`cache:${pattern}*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    // Non-fatal: ignore cache clear errors
  }
};

module.exports = { cache, clearCache };

