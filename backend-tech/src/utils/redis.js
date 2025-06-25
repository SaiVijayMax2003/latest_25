const Redis = require('redis');
const { promisify } = require('util');

const createRedisClient = async (app) => {
  try {
    const client = Redis.createClient({
      url: process.env.REDIS_URI,
    });

    client.on('error', (err) => {
      app.log.error(`Redis connection error: ${err}`);
    });

    client.on('connect', () => {
      app.log.info('Redis connected successfully');
    });

    await client.connect();

    // Promisify Redis commands
    const getAsync = promisify(client.get).bind(client);
    const setAsync = promisify(client.set).bind(client);
    const delAsync = promisify(client.del).bind(client);

    return {
      client,
      getAsync,
      setAsync,
      delAsync,
    };
  } catch (error) {
    app.log.error(`Redis connection error: ${error}`);
    process.exit(1);
  }
};

module.exports = createRedisClient; 