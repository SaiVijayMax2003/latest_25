// Global test setup
process.env.NODE_ENV = 'test';

// Mock environment variables
process.env.PORT = '3000';
process.env.MONGODB_URI = 'mongodb://localhost:27017/backend-tech-test';
process.env.REDIS_URI = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-secret-key';

// Global test timeout
jest.setTimeout(10000);

// Clean up after tests
afterAll(async () => {
  // Add any cleanup code here
}); 