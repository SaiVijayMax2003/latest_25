export async function errorHandler(error, request, reply) {
    // Log error
    request.log.error(error);

    // Handle specific errors
    if (error.validation) {
        return reply.status(400).send({
            error: 'Validation Error',
            details: error.validation
        });
    }

    if (error.statusCode === 401) {
        return reply.status(401).send({
            error: 'Unauthorized',
            message: error.message
        });
    }

    if (error.statusCode === 403) {
        return reply.status(403).send({
            error: 'Forbidden',
            message: error.message
        });
    }

    if (error.statusCode === 404) {
        return reply.status(404).send({
            error: 'Not Found',
            message: error.message
        });
    }

    // Default error response
    return reply.status(error.statusCode || 500).send({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
} 