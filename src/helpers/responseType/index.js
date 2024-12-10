module.exports = {
    success(data = {}, message = 'Request successful') {
        return {
            statusCode: 200,
            status: 'success',
            message,
            data,
        };
    },

    created(data = {}, message = 'Resource created successfully') {
        return {
            statusCode: 201,
            status: 'success',
            message,
            data,
        };
    },

    badRequest(errors = [], message = 'Bad request') {
        return {
            statusCode: 400,
            status: 'fail',
            message,
            errors,
        };
    },

    unauthorized(message = 'Unauthorized access') {
        return {
            statusCode: 401,
            status: 'fail',
            message,
        };
    },

    forbidden(message = 'Forbidden access') {
        return {
            statusCode: 403,
            status: 'fail',
            message,
        };
    },

    notFound(message = 'Resource not found') {
        return {
            statusCode: 404,
            status: 'fail',
            message,
        };
    },

    conflict(message = 'Resource conflict') {
        return {
            statusCode: 409,
            status: 'fail',
            message,
        };
    },

    unprocessableEntity(errors = [], message = 'Unprocessable entity') {
        return {
            statusCode: 422,
            status: 'fail',
            message,
            errors,
        };
    },

    internalServerError(message = 'Internal server error') {
        return {
            statusCode: 500,
            status: 'error',
            message,
        };
    },

    serviceUnavailable(message = 'Service unavailable') {
        return {
            statusCode: 503,
            status: 'error',
            message,
        };
    },
};
