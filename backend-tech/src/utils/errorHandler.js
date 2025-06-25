class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (error, request, reply) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    reply.code(error.statusCode).send({
      status: error.status,
      error: error,
      message: error.message,
      stack: error.stack,
    });
  } else {
    // Production mode
    if (error.isOperational) {
      reply.code(error.statusCode).send({
        status: error.status,
        message: error.message,
      });
    } else {
      // Programming or unknown errors
      console.error('ERROR 💥', error);
      reply.code(500).send({
        status: 'error',
        message: 'Something went wrong!',
      });
    }
  }
};

module.exports = {
  AppError,
  errorHandler,
}; 