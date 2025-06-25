# How to Write an API in This Project

## Understanding the Components

Each API module consists of four main components that work together to handle requests and responses. Here's what each component does:

**Schema (`[module-name].schema.js`)**:
The schema file is like a contract or blueprint for your API. It defines:
- What data is required for each request
- What format the data should be in
- What values are allowed
- What the response will look like
Think of it as a set of rules that ensure only valid data enters and leaves your API.

**Service (`[module-name].service.js`)**:
The service layer is where the actual business logic lives. It:
- Handles the core functionality of your feature
- Manages data operations (like database queries)
- Coordinates with other services
- Handles complex business rules
- Manages external service integrations (like sending emails or SMS)
It's like the brain of your feature, doing all the heavy lifting.

**Controller (`[module-name].controller.js`)**:
The controller is the traffic cop of your API. It:
- Receives incoming HTTP requests
- Validates the request data using schemas
- Calls the appropriate service methods
- Formats the response
- Handles errors and sets HTTP status codes
Think of it as the middleman between the outside world and your business logic.

**Routes (`[module-name].routes.js`)**:
The routes file is like a map of your API. It:
- Defines the URL paths for your endpoints
- Specifies which HTTP methods are allowed (GET, POST, etc.)
- Links URLs to controller methods
- Sets up API documentation
- Configures request validation
It's essentially the entry point to your API, telling the system which code to run when someone hits a particular URL.

**How They Work Together**:
1. A request comes in through a route
2. The route passes it to the controller
3. The controller validates the data using the schema
4. If valid, the controller calls the service
5. The service performs the business logic
6. The service returns the result to the controller
7. The controller formats the response
8. The route sends the response back to the client

This separation of concerns makes your code:
- Easier to maintain
- More testable
- More reusable
- Easier to understand
- More scalable

This guide will walk you through implementing a new API endpoint using the modular structure.

## Module Structure

Each feature/module should follow this structure:

```
src/
├── modules/
│   └── [module-name]/
│       ├── [module-name].routes.js      # Route definitions
│       ├── [module-name].controller.js  # Request handling
│       ├── [module-name].service.js     # Business logic
│       ├── [module-name].schema.js      # Validation schemas
│       └── __tests__/
│           ├── unit/
│           │   └── [module-name].service.test.js
│           └── integration/
│               └── [module-name].integration.test.js
└── utils/
    └── [utility-name].js                # Shared utilities
```

## Step 1: Create Module Structure

```bash
mkdir -p src/modules/[module-name]/__tests__/{unit,integration}
```

## Step 2: Create Schema

Define validation schemas using Joi:

```javascript
// src/modules/[module-name]/[module-name].schema.js
import Joi from 'joi';

export const createSchema = Joi.object({
    field1: Joi.string().required(),
    field2: Joi.number().required()
});

export const updateSchema = Joi.object({
    field1: Joi.string(),
    field2: Joi.number()
});
```

## Step 3: Create Service

Implement business logic:

```javascript
// src/modules/[module-name]/[module-name].service.js
import { someUtility } from '../../utils/someUtility';
import { someOtherService } from '../other-module/other-module.service';

class ModuleService {
    constructor() {
        // Initialize any dependencies
        this.someService = someOtherService;
    }

    async create(data) {
        try {
            // 1. Validate data (if needed)
            // 2. Transform data (if needed)
            const transformedData = this.transformData(data);
            
            // 3. Use utilities for common operations
            const processedData = someUtility.process(transformedData);
            
            // 4. Call other services if needed
            const result = await this.someService.doSomething(processedData);
            
            // 5. Return formatted response
            return {
                success: true,
                data: result
            };
        } catch (error) {
            // Handle specific errors
            if (error.name === 'ValidationError') {
                throw new Error('Invalid data provided');
            }
            throw error;
        }
    }

    transformData(data) {
        // Data transformation logic
        return {
            ...data,
            processedAt: new Date()
        };
    }
}

export const moduleService = new ModuleService();
```

## Step 4: Create Controller

Handle HTTP requests:

```javascript
// src/modules/[module-name]/[module-name].controller.js
import { moduleService } from './[module-name].service';
import { createSchema, updateSchema } from './[module-name].schema';

class ModuleController {
    async create(req, res) {
        try {
            const { error } = createSchema.validate(req.body);
            if (error) {
                return res.status(400).json({ error: error.details[0].message });
            }

            const result = await moduleService.create(req.body);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async update(req, res) {
        try {
            const { error } = updateSchema.validate(req.body);
            if (error) {
                return res.status(400).json({ error: error.details[0].message });
            }

            const result = await moduleService.update(req.params.id, req.body);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const moduleController = new ModuleController();
```

## Step 5: Create Routes

Define API endpoints:

```javascript
// src/modules/[module-name]/[module-name].routes.js
import express from 'express';
import { moduleController } from './[module-name].controller';

const router = express.Router();

router.post('/', moduleController.create);
router.put('/:id', moduleController.update);

export default router;
```

## Step 6: Create Utilities (When Needed)

Create utility functions for shared functionality:

```javascript
// src/utils/someUtility.js
import { someConfig } from '../config/someConfig';

export class SomeUtility {
    static process(data) {
        // Common processing logic
        return {
            ...data,
            processed: true
        };
    }

    static validate(data) {
        // Common validation logic
        return data && typeof data === 'object';
    }

    static formatResponse(data) {
        // Common response formatting
        return {
            success: true,
            data,
            timestamp: new Date()
        };
    }
}

// Usage in service:
import { SomeUtility } from '../../utils/someUtility';

class ModuleService {
    async someMethod(data) {
        const processed = SomeUtility.process(data);
        // ... rest of the logic
    }
}
```

## When to Create Utilities

Create utility functions when:
1. **Code Reusability**: The same logic is used across multiple modules
2. **Complex Operations**: The operation is complex and needs to be abstracted
3. **Common Patterns**: The code follows a common pattern used throughout the app
4. **External Services**: Integration with external services (e.g., SMS, Email)
5. **Data Transformation**: Common data transformation logic
6. **Validation**: Shared validation rules
7. **Formatting**: Common response/request formatting

Examples of utilities:
- `src/utils/sms.js` - SMS sending functionality
- `src/utils/email.js` - Email sending functionality
- `src/utils/validation.js` - Common validation rules
- `src/utils/formatting.js` - Data formatting utilities
- `src/utils/logger.js` - Logging utilities

## Step 7: Write Tests

1. Unit Tests:

```javascript
// src/modules/[module-name]/__tests__/unit/[module-name].service.test.js
import { moduleService } from '../[module-name].service';
import { SomeUtility } from '../../../utils/someUtility';

jest.mock('../../../utils/someUtility');

describe('ModuleService', () => {
    describe('create', () => {
        it('should create successfully', async () => {
            const data = { field1: 'test', field2: 123 };
            SomeUtility.process.mockReturnValue(data);
            
            const result = await moduleService.create(data);
            expect(result.success).toBe(true);
            expect(SomeUtility.process).toHaveBeenCalledWith(data);
        });
    });
});
```

2. Integration Tests:

```javascript
// src/modules/[module-name]/__tests__/integration/[module-name].integration.test.js
import request from 'supertest';
import app from '../../../app';

describe('Module API', () => {
    describe('POST /module', () => {
        it('should create successfully', async () => {
            const response = await request(app)
                .post('/module')
                .send({ field1: 'test', field2: 123 });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });
});
```

## Best Practices

1. **Module Organization**:
   - Keep all related code in the module folder
   - Use clear, descriptive names
   - Follow the established file structure

2. **Service Layer**:
   - Keep business logic in services
   - Use dependency injection for other services
   - Handle errors appropriately
   - Use utilities for common operations

3. **Utilities**:
   - Keep utilities focused and single-purpose
   - Use static methods for utility classes
   - Document utility functions
   - Test utilities independently

4. **Code Style**:
   - Use ES6+ features
   - Follow consistent naming conventions
   - Add JSDoc comments for functions

5. **Error Handling**:
   - Use try-catch blocks in controllers
   - Provide meaningful error messages
   - Use appropriate HTTP status codes

6. **Testing**:
   - Write both unit and integration tests
   - Mock external dependencies
   - Test error cases
   - Maintain 80%+ test coverage

7. **Documentation**:
   - Add JSDoc comments
   - Document API endpoints
   - Keep README updated

## Example Module: OTP

See the OTP module implementation for a complete example:
- `src/modules/otp/otp.schema.js`
- `src/modules/otp/otp.service.js`
- `src/modules/otp/otp.controller.js`
- `src/modules/otp/otp.routes.js`
- `src/modules/otp/__tests__/unit/otp.service.test.js`
- `src/modules/otp/__tests__/integration/otp.integration.test.js`

## API Documentation with Fastify and Swagger

To enable automatic API documentation, we'll use Fastify with Swagger. Here's how to set it up:

1. **Install Required Dependencies**:
```bash
npm install fastify @fastify/swagger @fastify/swagger-ui
```

2. **Configure Fastify with Swagger**:
```javascript
// src/config/swagger.js
export const swaggerConfig = {
    swagger: {
        info: {
            title: 'Backend API Documentation',
            description: 'API documentation for the backend service',
            version: '1.0.0'
        },
        host: 'localhost:3000',
        schemes: ['http', 'https'],
        consumes: ['application/json'],
        produces: ['application/json'],
        tags: [
            { name: 'auth', description: 'Authentication related endpoints' },
            { name: 'users', description: 'User management endpoints' }
        ]
    }
};
```

3. **Update Module Structure**:
```javascript
// src/modules/[module-name]/[module-name].routes.js
import { FastifyInstance } from 'fastify';

export default async function routes(fastify: FastifyInstance) {
    fastify.post('/', {
        schema: {
            tags: ['module-name'],
            summary: 'Create a new item',
            body: {
                type: 'object',
                required: ['field1', 'field2'],
                properties: {
                    field1: { type: 'string' },
                    field2: { type: 'number' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: { type: 'object' }
                    }
                }
            }
        },
        handler: moduleController.create
    });
}
```

4. **Update Service Implementation**:
```javascript
// src/modules/[module-name]/[module-name].service.js
import { FastifyInstance } from 'fastify';

class ModuleService {
    constructor(fastify) {
        this.fastify = fastify;
    }

    async create(data) {
        try {
            // Business logic here
            return { success: true, data };
        } catch (error) {
            this.fastify.log.error(error);
            throw error;
        }
    }
}

export const moduleService = new ModuleService();
```

5. **Update Controller Implementation**:
```javascript
// src/modules/[module-name]/[module-name].controller.js
class ModuleController {
    constructor(fastify) {
        this.fastify = fastify;
    }

    async create(request, reply) {
        try {
            const result = await moduleService.create(request.body);
            return reply.code(200).send(result);
        } catch (error) {
            this.fastify.log.error(error);
            return reply.code(500).send({ error: error.message });
        }
    }
}

export const moduleController = new ModuleController();
```

6. **Register Routes in Fastify**:
```javascript
// src/index.js
import Fastify from 'fastify';
import { swaggerConfig } from './config/swagger';
import moduleRoutes from './modules/[module-name]/[module-name].routes';

const fastify = Fastify({
    logger: true
});

// Register Swagger
await fastify.register(require('@fastify/swagger'), swaggerConfig);
await fastify.register(require('@fastify/swagger-ui'), {
    routePrefix: '/documentation'
});

// Register routes
fastify.register(moduleRoutes, { prefix: '/api/module' });

// Start server
const start = async () => {
    try {
        await fastify.listen({ port: 3000 });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
```

7. **Access Documentation**:
- After starting the server, visit `http://localhost:3000/documentation`
- The Swagger UI will show all registered routes with their schemas
- You can test endpoints directly from the UI

### Benefits of Fastify with Swagger:
1. **Automatic Documentation**: API documentation is generated from route schemas
2. **Type Safety**: Schema validation ensures type safety
3. **Interactive Testing**: Test endpoints directly from the documentation
4. **Performance**: Fastify is faster than Express
5. **Validation**: Built-in request/response validation
6. **Logging**: Built-in logging capabilities

### Best Practices for API Documentation:
1. **Complete Schemas**: Define complete request/response schemas
2. **Descriptive Tags**: Use meaningful tags for route grouping
3. **Examples**: Include examples in schemas where helpful
4. **Error Responses**: Document all possible error responses
5. **Versioning**: Include API version in documentation
6. **Security**: Document authentication requirements
7. **Descriptions**: Add clear descriptions for each endpoint 