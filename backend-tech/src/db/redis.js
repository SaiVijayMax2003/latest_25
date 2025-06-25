import Redis from 'ioredis';
import { logger } from '../utils/logger.js';

let redisClient = null;

export async function connectToRedis() {
    try {
        // Check if Redis is enabled (case-insensitive)
        const redisEnabled = process.env.REDIS_ENABLED?.toLowerCase() !== 'false';
        if (!redisEnabled) {
            logger.info('Redis is disabled. Skipping Redis connection.');
            return null;
        }

        if (!redisClient) {
            redisClient = new Redis({
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                password: process.env.REDIS_PASSWORD || '',
                retryStrategy: (times) => {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                }
            });

            redisClient.on('error', (err) => {
                logger.error('Redis error:', err);
            });

            redisClient.on('connect', () => {
                logger.info('Connected to Redis');
            });

            // Test the connection
            await redisClient.ping();
            logger.info('Redis connection established');
        }
        return redisClient;
    } catch (error) {
        logger.error('Failed to connect to Redis:', error);
        throw error;
    }
}

export async function disconnectFromRedis() {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
        logger.info('Disconnected from Redis');
    }
}

export function getRedisClient() {
    const redisEnabled = process.env.REDIS_ENABLED?.toLowerCase() !== 'false';
    if (!redisEnabled) {
        logger.info('Redis is disabled. Returning null client.');
        return null;
    }
    
    if (!redisClient) {
        throw new Error('Redis client not initialized. Call connectToRedis() first.');
    }
    return redisClient;
} 