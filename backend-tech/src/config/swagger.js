export const swaggerConfig = {
    openapi: {
        info: {
            title: 'Backend API Documentation',
            description: 'API documentation for the backend service',
            version: '1.0.0'
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
        tags: [
            { name: 'auth', description: 'Authentication related endpoints' },
            { name: 'users', description: 'User management endpoints' },
            { name: 'otp', description: 'OTP related endpoints' }
        ]
    }
}; 