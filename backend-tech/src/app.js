// Load environment variables first
import './config/env.js';

import Fastify from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import cors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyMetrics from 'fastify-metrics';
import mongoose from 'mongoose';
import { connectToMongo, disconnectFromMongo } from './db/mongo.js';
import { connectToRedis, disconnectFromRedis } from './db/redis.js';
import otpRoutes from './modules/otp/otp.routes.js';
import tutorRoutes from './modules/tutor/tutor.routes.js';
import studentRoutes from './modules/student/student.routes.js';
import llmRoutes from './modules/llm/routes.js';
import feedbackRoutes from './modules/feedback/feedback.routes.js';
import { llmService } from './modules/llm/services/llmService.js';
import { logger } from './utils/logger.js';
import entityLogger from './utils/entityLogger.js';
import dotenv from 'dotenv';
import urlCron from './cron/urlCron.js';
import * as controller from './modules/student/student.controller.js';
import urlRoutes from './modules/url/url.routes.js';
import env from '@fastify/env';
import userRoutes from './modules/users/users.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import fastifyMongo from '@fastify/mongodb';
import formRoutes from './modules/form/form.routes.js';
import { setupUtilizationCron } from './cron/utilizationCron.js';
import studentFormRoutes from './modules/studentForm/studentForm.routes.js';
// Load environment variables from .env.development
import {testTutorTextCron} from './cron/testTutorTextCron.js';
import fileuploadRoutes from './modules/fileupload/fileupload.routes.js';
import multer from 'fastify-multer';
import demoSessionRoutes from './modules/demosession/demosession.routes.js';
import demosessionCron from './cron/demosessionCron.js';
import orderRoutes from './modules/order/order.routes.js';
import emailRoutes from './modules/email-template/email.routes.js';
import smsRoutes from './modules/sms-template/sms.routes.js';
import notificationRoutes from './modules/notification/notification.routes.js';
import externalPaymentsRoutes from './modules/externalpayments/externalpayments.routes.js';
import questionRoutes from './modules/tests/question.routes.js';
import { initializeSocket } from './modules/notification/notification.websocket.js';

dotenv.config({ path: '.env.development' });

const isProduction = process.env.NODE_ENV === 'production';

const app = Fastify({
    logger: {
        level: isProduction ? 'info' : 'debug'
    }
});

// Set up entityLogger to use Fastify's logger
entityLogger.setFastify(app);

// Register plugins
app.register(cors, {
    origin: true,  // Allow all origins in development
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
});
app.register(fastifyHelmet);
app.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute'
});
app.register(fastifyMetrics, { endpoint: '/metrics' });

// Register MongoDB plugin
app.register(fastifyMongo, {
    forceClose: true,
    url: process.env.MONGODB_URI
});

// Register JWT and auth middleware
app.register(import('@fastify/jwt'), {
    secret: process.env.JWT_SECRET,
    sign: {
        expiresIn: '7d'
    }
});

// Add authentication decorator
app.decorate('authenticate', async (request, reply) => {
    try {
        await request.jwtVerify();
    } catch (err) {
        reply.send(err);
    }
});

// Add authorization decorator
app.decorate('authorize', (roles) => {
    return async (request, reply) => {
        try {
            const user = request.user;
            if (!roles.includes(user.role)) {
                return reply.status(403).send({
                    error: 'Forbidden',
                    message: 'You do not have permission to access this resource'
                });
            }
        } catch (err) {
            reply.send(err);
        }
    };
});

// Register multer content parser
app.register(multer.contentParser);
const upload = multer({ storage: multer.memoryStorage() });

// Swagger configuration
app.register(fastifySwagger, {
    openapi: {
        info: {
            title: 'Backend API Documentation',
            description: 'API documentation for the backend service',
            version: '1.0.0',
            contact: {
                name: 'API Support',
                email: 'support@example.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [{ bearerAuth: [] }],
    }
});

app.register(fastifySwaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
        docExpansion: 'list',
        deepLinking: false
    },
    staticCSP: true,
    transformStaticCSP: (header) => header
});

// Register routes
app.register(otpRoutes, { prefix: '/otp' });
app.register(tutorRoutes, { prefix: '/tutors' });
app.register(studentRoutes, { prefix: '/students' });
app.register(llmRoutes, { prefix: '/llm'});
app.register(userRoutes, { prefix: '/users' });
app.register(adminRoutes, { prefix: '/admin' });
app.register(formRoutes, { prefix: '/form' });
app.register(feedbackRoutes,{prefix:'/feedback'})
app.register(urlRoutes, { prefix: '/url' });
app.register(studentFormRoutes, { prefix: '/student-form' });
app.register(fileuploadRoutes, { prefix: '/fileservice' });
app.register(demoSessionRoutes, { prefix: '/demos' });
app.register(orderRoutes, { prefix: '/orders' });
app.register(emailRoutes, { prefix: '/email' });
app.register(smsRoutes, { prefix: '/sms' });
app.register(notificationRoutes, { prefix: '/notifications' });
app.register(externalPaymentsRoutes, { prefix: '/external-payments' });
app.register(questionRoutes, { prefix: '/questions' });


// Setup cron jobs
setupUtilizationCron(app);
testTutorTextCron();
demosessionCron();
// Health check route
app.get('/health', {
    schema: {
        description: 'Health check endpoint',
        tags: ['System'],
        response: {
            200: {
                type: 'object',
                properties: {
                    status: { type: 'string' }
                }
            }
        }
    }
}, async () => {
    return { status: 'ok' };
});

// Register environment variables
app.register(env, {
    schema: {
        type: 'object',
        required: ['PORT', 'MONGODB_URI', 'JWT_SECRET', 'CORS_ORIGIN'],
        properties: {
            PORT: {
                type: 'string',
                default: 3000
            },
            MONGODB_URI: {
                type: 'string'
            },
            JWT_SECRET: {
                type: 'string'
            },
            CORS_ORIGIN: {
                type: 'string'
            }
        }
    },
    dotenv: true
});

// Global authentication and authorization hook
app.addHook('onRequest', async (request, reply) => {
    const publicPrefixes = ['/users', '/otp', '/url', '/health', '/documentation', '/form', '/external-payments'];
    const isPublic = publicPrefixes.some(prefix => request.raw.url.startsWith(prefix));
    if (isPublic) return;
    try {
        await request.jwtVerify();
        // Allow all roles to access their respective routes
        const allowedRoles = ['admin', 'operation', 'sales', 'student', 'tutor', 'operations_lead', 'sales_lead', 'accounts'];
        if (!allowedRoles.includes(request.user.role)) {
            return reply.status(403).send({
                error: 'Forbidden',
                message: 'You do not have permission to access this resource'
            });
        }
    } catch (err) {
        return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Invalid or missing token'
        });
    }
});

// Role-specific route protection
app.addHook('onRoute', (routeOptions) => {
    // Add role-based access control for specific routes
    if (routeOptions.url.startsWith('/tutors/')) {
        routeOptions.preHandler = [
            ...(routeOptions.preHandler || []),
            async (request, reply) => {
                // Allow admin, operation, sales, and tutor roles
                const allowedRoles = ['admin', 'operation', 'sales', 'tutor'];
                if (!allowedRoles.includes(request.user.role)) {
                    return reply.status(403).send({
                        error: 'Forbidden',
                        message: 'You do not have permission to access tutor resources'
                    });
                }
            }
        ];
    }

    if (routeOptions.url.startsWith('/students/')) {
        routeOptions.preHandler = [
            ...(routeOptions.preHandler || []),
            async (request, reply) => {
                // Allow admin, operation, sales, student, and tutor roles
                const allowedRoles = ['admin', 'operation', 'sales', 'student', 'tutor'];
                if (!allowedRoles.includes(request.user.role)) {
                    return reply.status(403).send({
                        error: 'Forbidden',
                        message: 'You do not have permission to access student resources'
                    });
                }
            }
        ];
    }

    // LLM module access control
    if (routeOptions.url.startsWith('/llm/')) {
        routeOptions.preHandler = [
            ...(routeOptions.preHandler || []),
            async (request, reply) => {
                // Allow admin, operation, sales, tutor, and student roles
                const allowedRoles = ['admin', 'operation', 'sales', 'tutor', 'student'];
                if (!allowedRoles.includes(request.user.role)) {
                    return reply.status(403).send({
                        error: 'Forbidden',
                        message: 'You do not have permission to access LLM modules'
                    });
                }
            }
        ];
    }
});

// Minimal test upload route using fastify-multer
app.post('/test-upload', { preHandler: upload.single('file') }, async (req, reply) => {
  if (!req.file) {
    return reply.code(400).send({ error: 'No file uploaded' });
  }
  const { originalname, mimetype, buffer, size } = req.file;
  return reply.send({ filename: originalname, mimetype, size });
});

// Start server
const start = async () => {
    try {
        // Load MongoDB URI from environment variables
        const MONGODB_URI = process.env.MONGODB_URI;
        const MONGODB_DBNAME = process.env.MONGODB_DBNAME;
        if (!MONGODB_URI) {
            logger.error('❌ MONGODB_URI is not set in environment variables.');
            process.exit(1);
        }

        logger.info('🔍 MongoDB Connection Details:');
        logger.info('URI:', MONGODB_URI);

        // Connect to MongoDB and Redis
       
        await connectToRedis();
        await connectToMongo();
        // Connect to MongoDB and print logs
        // await mongoose.connect(MONGODB_URI, {
        //     useNewUrlParser: true,
        //     useUnifiedTopology: true,
        //     dbName: process.env.MONGODB_DBNAME // Explicitly set the database name
        // });
        logger.info(`✅ Connected to MongoDB`);
        logger.info('Database Name:', mongoose.connection.db.databaseName);
        logger.info('Collections:', await mongoose.connection.db.listCollections().toArray());

        // Initialize LLM vector store if enabled and OpenAI API key is available
        const isLLMEnabled = process.env.LLM_ENABLED === 'true';
        if (isLLMEnabled && process.env.OPENAI_API_KEY) {
            try {
                // Removed: await llmService.initializeVectorStore();
                logger.info('✅ LLM features enabled (vector store initialization skipped)');
            } catch (error) {
                logger.warn('⚠️ LLM initialization failed:', error.message);
                logger.warn('⚠️ LLM features will be disabled');
            }
        } else {
            if (!isLLMEnabled) {
                logger.info('ℹ️ LLM features are disabled (LLM_ENABLED=false)');
            } else {
                logger.warn('⚠️ OPENAI_API_KEY not set. LLM features will be disabled');
            }
        }

        // Setup cron jobs
        urlCron();

        // Start server
        const port = process.env.PORT || 3000;
        const host = '0.0.0.0';
        
        await app.listen({ port, host });
        logger.info(`Server is running on http://${host}:${port}`);
        
        // Initialize Socket.io after the server starts listening
        const server = app.server;
        initializeSocket(server);
        logger.info('✅ Socket.io initialized with JWT authentication');

        if (!isProduction) {
            logger.info('API documentation available at http://localhost:3000/documentation');
        }
    } catch (err) {
        logger.error('Server startup error:', err);
        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM signal. Starting graceful shutdown...');
    await app.close();
    await disconnectFromMongo();
    await disconnectFromRedis();
    process.exit(0);
});

start(); 