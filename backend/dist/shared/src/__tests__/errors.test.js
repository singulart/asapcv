"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../types/errors");
describe('Error Handling', () => {
    describe('createError', () => {
        it('should create a basic error with default message', () => {
            const error = (0, errors_1.createError)(errors_1.ErrorCode.INVALID_CREDENTIALS);
            expect(error.code).toBe(errors_1.ErrorCode.INVALID_CREDENTIALS);
            expect(error.message).toBe(errors_1.ErrorMessages[errors_1.ErrorCode.INVALID_CREDENTIALS]);
            expect(error.timestamp).toBeInstanceOf(Date);
        });
        it('should create an error with custom message', () => {
            const customMessage = 'Custom error message';
            const error = (0, errors_1.createError)(errors_1.ErrorCode.INTERNAL_SERVER_ERROR, customMessage);
            expect(error.code).toBe(errors_1.ErrorCode.INTERNAL_SERVER_ERROR);
            expect(error.message).toBe(customMessage);
        });
        it('should include request ID and user ID when provided', () => {
            const requestId = 'req-123';
            const userId = 'user-456';
            const error = (0, errors_1.createError)(errors_1.ErrorCode.UNAUTHORIZED, undefined, undefined, requestId, userId);
            expect(error.requestId).toBe(requestId);
            expect(error.userId).toBe(userId);
        });
    });
    describe('createValidationError', () => {
        it('should create a validation error with field details', () => {
            const error = (0, errors_1.createValidationError)('email', 'invalid-email', 'must be valid email');
            expect(error.code).toBe(errors_1.ErrorCode.VALIDATION_ERROR);
            expect(error.details.field).toBe('email');
            expect(error.details.value).toBe('invalid-email');
            expect(error.details.constraint).toBe('must be valid email');
        });
    });
    describe('createRateLimitError', () => {
        it('should create a rate limit error with timing details', () => {
            const error = (0, errors_1.createRateLimitError)(1, 15, 10);
            expect(error.code).toBe(errors_1.ErrorCode.RATE_LIMIT_EXCEEDED);
            expect(error.details.limit).toBe(1);
            expect(error.details.windowSeconds).toBe(15);
            expect(error.details.retryAfter).toBe(10);
        });
    });
    describe('createResourceNotFoundError', () => {
        it('should create a resource not found error', () => {
            const error = (0, errors_1.createResourceNotFoundError)('CV', 'cv-123', errors_1.ErrorCode.CV_NOT_FOUND);
            expect(error.code).toBe(errors_1.ErrorCode.CV_NOT_FOUND);
            expect(error.details.resourceType).toBe('CV');
            expect(error.details.resourceId).toBe('cv-123');
        });
    });
    describe('formatErrorResponse', () => {
        it('should format error for API response', () => {
            const error = (0, errors_1.createError)(errors_1.ErrorCode.INVALID_CREDENTIALS);
            const response = (0, errors_1.formatErrorResponse)(error);
            expect(response.success).toBe(false);
            expect(response.error.code).toBe(errors_1.ErrorCode.INVALID_CREDENTIALS);
            expect(response.error.message).toBe(errors_1.ErrorMessages[errors_1.ErrorCode.INVALID_CREDENTIALS]);
            expect(response.timestamp).toBeInstanceOf(Date);
        });
    });
    describe('ErrorHttpStatusMap', () => {
        it('should map validation errors to 400', () => {
            expect(errors_1.ErrorHttpStatusMap[errors_1.ErrorCode.VALIDATION_ERROR]).toBe(400);
            expect(errors_1.ErrorHttpStatusMap[errors_1.ErrorCode.INVALID_FILE_FORMAT]).toBe(400);
        });
        it('should map auth errors to 401', () => {
            expect(errors_1.ErrorHttpStatusMap[errors_1.ErrorCode.INVALID_CREDENTIALS]).toBe(401);
            expect(errors_1.ErrorHttpStatusMap[errors_1.ErrorCode.TOKEN_EXPIRED]).toBe(401);
        });
        it('should map not found errors to 404', () => {
            expect(errors_1.ErrorHttpStatusMap[errors_1.ErrorCode.USER_NOT_FOUND]).toBe(404);
            expect(errors_1.ErrorHttpStatusMap[errors_1.ErrorCode.CV_NOT_FOUND]).toBe(404);
        });
        it('should map rate limit errors to 429', () => {
            expect(errors_1.ErrorHttpStatusMap[errors_1.ErrorCode.RATE_LIMIT_EXCEEDED]).toBe(429);
        });
        it('should map server errors to 500', () => {
            expect(errors_1.ErrorHttpStatusMap[errors_1.ErrorCode.INTERNAL_SERVER_ERROR]).toBe(500);
            expect(errors_1.ErrorHttpStatusMap[errors_1.ErrorCode.DATABASE_ERROR]).toBe(500);
        });
    });
    describe('ErrorMessages', () => {
        it('should have user-friendly messages for all error codes', () => {
            Object.values(errors_1.ErrorCode).forEach((code) => {
                expect(errors_1.ErrorMessages[code]).toBeDefined();
                expect(errors_1.ErrorMessages[code].length).toBeGreaterThan(0);
            });
        });
    });
});
