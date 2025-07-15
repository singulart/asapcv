"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiError = exports.errorHandler = void 0;
const errorHandler = (error, req, res, next) => {
    // Log error for monitoring
    console.error('API Error:', {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    });
    // Default error response
    const statusCode = error.statusCode || 500;
    const errorCode = error.code || 'INTERNAL_SERVER_ERROR';
    const errorResponse = {
        error: {
            code: errorCode,
            message: error.message || 'An unexpected error occurred',
            details: error.details || null,
            timestamp: new Date().toISOString()
        }
    };
    // Don't expose internal error details in production
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
        errorResponse.error.message = 'Internal server error';
        errorResponse.error.details = null;
    }
    res.status(statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
// Helper function to create API errors
const createApiError = (message, statusCode = 500, code, details) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    error.details = details;
    return error;
};
exports.createApiError = createApiError;
