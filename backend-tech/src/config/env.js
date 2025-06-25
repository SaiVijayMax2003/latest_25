import { config } from 'dotenv';
import { logger } from '../utils/logger.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' 
    ? '.env' 
    : '.env.development';

const envPath = join(__dirname, '../../', envFile);

// Try to load environment variables from file, but don't throw if missing in production
let result = { error: null };
if (process.env.NODE_ENV !== 'production') {
    // In development, require the .env.development file
    result = config({ path: envPath });
if (result.error) {
    logger.error('Error loading environment variables:', result.error);
    throw result.error;
    }
} else {
    // In production, try to load .env if it exists, but don't throw if missing
    try {
        result = config({ path: envPath });
        if (result.error) {
            logger.warn('No .env file found in production. Using platform environment variables.');
        }
    } catch (e) {
        logger.warn('No .env file found in production. Using platform environment variables.');
    }
}

// Log loaded environment (masking sensitive values)
logger.debug('Environment loaded:', {
    NODE_ENV: process.env.NODE_ENV,
    MSG91_API_KEY: process.env.MSG91_API_KEY ? '***' : 'not set',
    MSG91_TEMPLATE_ID: process.env.MSG91_OTP_TEMPLATE_ID || 'not set',
    envFile
});

export const envConfig = {
    schema: {
        type: 'object',
        required: ['PORT', 'MONGODB_URI', 'JWT_SECRET', 'REDIS_HOST', 'REDIS_PORT'],
        properties: {
            PORT: {
                type: 'number',
                default: 3000
            },
            NODE_ENV: {
                type: 'string',
                default: 'development'
            },
            MONGODB_URI: {
                type: 'string'
            },
            JWT_SECRET: {
                type: 'string'
            },
            JWT_EXPIRES_IN: {
                type: 'string',
                default: '24h'
            },
            REDIS_HOST: {
                type: 'string',
                default: 'localhost'
            },
            REDIS_PORT: {
                type: 'number',
                default: 6379
            },
            REDIS_PASSWORD: {
                type: 'string',
                default: ''
            },
            MSG91_API_KEY: {
                type: 'string'
            },
            LOG_LEVEL: {
                type: 'string',
                default: 'info'
            }
        }
    },
    dotenv: true
}; 
