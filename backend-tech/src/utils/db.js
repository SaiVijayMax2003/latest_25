const mongoose = require('mongoose');

const connectDB = async (app) => {
  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'appdata_test'
    });

    app.log.info(`MongoDB connected: ${connection.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      app.log.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      app.log.warn('MongoDB disconnected');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      process.exit(0);
    });

    return connection;
  } catch (error) {
    app.log.error(`MongoDB connection error: ${error}`);
    process.exit(1);
  }
};

module.exports = connectDB; 