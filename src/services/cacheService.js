const redis = require('../config/redis');
const logger = require('../config/logger');

const getCachedTasks = async (userId) => {
  try {
    const cachedTasks = await redis.get(`tasks:${userId}`);
    return cachedTasks ? JSON.parse(cachedTasks) : null;
  } catch (error) {
    logger.error('Cache get error:', error);
    return null;
  }
};

const setCachedTasks = async (userId, tasks) => {
  try {
    await redis.set(`tasks:${userId}`, JSON.stringify(tasks), 'EX', 3600); // 1 hour
  } catch (error) {
    logger.error('Cache set error:', error);
  }
};

const clearCachedTasks = async (userId) => {
  try {
    await redis.del(`tasks:${userId}`);
  } catch (error) {
    logger.error('Cache clear error:', error);
  }
};

module.exports = { getCachedTasks, setCachedTasks, clearCachedTasks };
