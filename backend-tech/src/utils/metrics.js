const client = require('prom-client');

// Create a Registry to register metrics
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({
  register,
  prefix: 'backend_tech_',
});

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

const activeUsers = new client.Gauge({
  name: 'active_users',
  help: 'Number of active users',
});

// Register custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(activeUsers);

// Middleware to track request duration
const metricsMiddleware = async (request, reply) => {
  const start = Date.now();
  const response = await reply;
  const duration = (Date.now() - start) / 1000;

  httpRequestDuration
    .labels(request.method, request.routeOptions.url, reply.statusCode)
    .observe(duration);

  return response;
};

module.exports = {
  register,
  metricsMiddleware,
  activeUsers,
}; 