import Fastify from 'fastify';
import { swaggerConfig } from './config/swagger.js';
import { envConfig } from './config/env.js';
import { metricsConfig } from './config/metrics.js';
import { connectToMongo } from './db/mongo.js';
import { connectToRedis } from './db/redis.js';
import { registerRoutes } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

// Create Fastify instance
const fastify = Fastify({
    logger: true
});

// Register plugins
async function registerPlugins() {
    // Environment variables
    await fastify.register(import('@fastify/env'), envConfig);

    // CORS
    await fastify.register(import('@fastify/cors'), {
        origin: true,
        credentials: true
    });

    // JWT
    await fastify.register(import('@fastify/jwt'), {
        secret: process.env.JWT_SECRET
    });

    // Rate limiting
    await fastify.register(import('@fastify/rate-limit'), {
        max: 100,
        timeWindow: '1 minute'
    });

    // MongoDB
    await fastify.register(import('@fastify/mongodb'), {
        forceClose: true,
        url: process.env.MONGODB_URI
    });

    // Swagger
    await fastify.register(import('@fastify/swagger'), swaggerConfig);
    await fastify.register(import('@fastify/swagger-ui'), {
        routePrefix: '/documentation'
    });

    // Metrics
    await fastify.register(import('fastify-metrics'), metricsConfig);
}

// Initialize application
async function initialize() {
    try {
        // Register plugins
        await registerPlugins();

        // Connect to databases
        await connectToMongo();
        await connectToRedis();

        // Register routes
        await registerRoutes(fastify);

        // Register error handler
        fastify.setErrorHandler(errorHandler);

        return fastify;
    } catch (err) {
        fastify.log.error(err);
        throw err;
    }
}

export { initialize }; 