import winston from 'winston';
import { mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const { combine, timestamp, printf, colorize } = winston.format;

// Custom format
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}] : ${message}`;
    if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
});

// JSON format for production
const jsonFormat = printf(({ level, message, timestamp, ...metadata }) => {
    return JSON.stringify({
        timestamp,
        level,
        message,
        ...metadata
    });
});

// Determine log level based on environment
const getLogLevel = () => {
    const env = process.env.NODE_ENV || 'development';
    const logLevel = process.env.LOG_LEVEL;
    
    console.log('Environment:', env);
    console.log('LOG_LEVEL:', logLevel);
    
    if (env === 'development') {
        console.log('Setting log level to debug for development environment');
        return 'debug';
    }
    return logLevel || 'info';
};

// Create logger instance
const logger = winston.createLogger({
    level: getLogLevel(),
    format: combine(
        timestamp(),
        process.env.NODE_ENV === 'production' ? jsonFormat : logFormat
    ),
    transports: [
        new winston.transports.Console({
            format: combine(
                process.env.NODE_ENV === 'production' ? jsonFormat : colorize(),
                process.env.NODE_ENV === 'production' ? jsonFormat : logFormat
            )
        }),
        new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error',
            format: combine(
                timestamp(),
                jsonFormat
            )
        }),
        new winston.transports.File({ 
            filename: 'logs/combined.log',
            format: combine(
                timestamp(),
                jsonFormat
            )
        })
    ]
});

// Log the current configuration
console.log('Logger configured with level:', logger.level);

// Create logs directory if it doesn't exist
const __dirname = dirname(fileURLToPath(import.meta.url));
const logsDir = join(process.cwd(), 'logs');

try {
    await mkdir(logsDir, { recursive: true });
} catch (error) {
    if (error.code !== 'EEXIST') {
        console.error('Error creating logs directory:', error);
    }
}

export { logger }; 