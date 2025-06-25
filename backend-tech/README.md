# Backend API

A modern, scalable backend API built with Fastify, Redis, and Swagger.

## Prerequisites

- Node.js (v18 or higher)
- Redis (v6 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd backend-tech
```

2. Install dependencies:
```bash
npm install
```

3. Set up Redis:

   **Local Development:**
   ```bash
   # macOS (using Homebrew)
   brew install redis
   brew services start redis

   # Ubuntu/Debian
   sudo apt update
   sudo apt install redis-server
   sudo systemctl start redis-server

   # Windows (using WSL)
   sudo apt update
   sudo apt install redis-server
   sudo service redis-server start
   ```

   **Production:**
   - Use a managed Redis service (e.g., Redis Cloud, AWS ElastiCache)
   - The connection URI will be provided by your Redis service provider

4. Create environment files:

   **Development (.env.development):**
   ```bash
   cp .env.example .env.development
   ```
   Edit `.env.development`:
   ```
   NODE_ENV=development
   PORT=3000
   REDIS_HOST=localhost
   REDIS_PORT=6379
   MSG91_API_KEY=your_api_key
   MSG91_TEMPLATE_ID=your_template_id
   LOG_LEVEL=debug
   ```

   **Production (.env):**
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```
   NODE_ENV=production
   PORT=3000
   REDIS_URL=redis://username:password@host:port
   MSG91_API_KEY=your_api_key
   MSG91_TEMPLATE_ID=your_template_id
   LOG_LEVEL=info
   ```

5. Start the development server:
```bash
npm run dev
```

## Project Structure

```
src/
├── modules/               # Feature modules
│   └── [module-name]/    # Each module contains:
│       ├── routes.js     # API route definitions
│       ├── controller.js # Request handling
│       ├── service.js    # Business logic
│       └── schema.js     # Validation schemas
├── config/               # Configuration files
├── db/                   # Database connections
├── utils/                # Utility functions
└── app.js               # Application entry point
```

## Development

1. Start the development server:
```bash
npm run dev
```

2. Run tests:
```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run tests with coverage
npm run test:coverage
```

## API Documentation

Access the API documentation at:
- Development: `http://localhost:3000/documentation`
- Production: `https://your-domain.com/documentation`

## Environment Configuration

### Development (.env.development)
- Used for local development
- Contains local Redis configuration
- Debug logging enabled
- Local API endpoints

### Production (.env)
- Used in production environment
- Contains production Redis URL
- Info level logging
- Production API endpoints

### Redis Configuration
- Development: Uses local Redis instance
- Production: Uses Redis connection URI
- Environment variables:
  - `REDIS_ENABLED`: Controls whether Redis is used (default: true)
    - Set to 'false' to disable Redis and use in-memory storage instead
    - Useful for development environments where Redis is not available
    - When disabled, OTPs are stored in memory with automatic cleanup
  - `REDIS_HOST`: Local Redis host (development)
  - `REDIS_PORT`: Local Redis port (development)
  - `REDIS_URL`: Full Redis connection URI (production)

## Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests
4. Submit a pull request
