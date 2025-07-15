import {
  ErrorCode,
  ErrorHttpStatusMap,
  ErrorMessages,
  createError,
  createValidationError,
  createRateLimitError,
  createResourceNotFoundError,
  formatErrorResponse,
} from '../types/errors';

describe('Error Handling', () => {
  describe('createError', () => {
    it('should create a basic error with default message', () => {
      const error = createError(ErrorCode.INVALID_CREDENTIALS);

      expect(error.code).toBe(ErrorCode.INVALID_CREDENTIALS);
      expect(error.message).toBe(ErrorMessages[ErrorCode.INVALID_CREDENTIALS]);
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should create an error with custom message', () => {
      const customMessage = 'Custom error message';
      const error = createError(ErrorCode.INTERNAL_SERVER_ERROR, customMessage);

      expect(error.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
      expect(error.message).toBe(customMessage);
    });

    it('should include request ID and user ID when provided', () => {
      const requestId = 'req-123';
      const userId = 'user-456';
      const error = createError(
        ErrorCode.UNAUTHORIZED,
        undefined,
        undefined,
        requestId,
        userId
      );

      expect(error.requestId).toBe(requestId);
      expect(error.userId).toBe(userId);
    });
  });

  describe('createValidationError', () => {
    it('should create a validation error with field details', () => {
      const error = createValidationError(
        'email',
        'invalid-email',
        'must be valid email'
      );

      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.details.field).toBe('email');
      expect(error.details.value).toBe('invalid-email');
      expect(error.details.constraint).toBe('must be valid email');
    });
  });

  describe('createRateLimitError', () => {
    it('should create a rate limit error with timing details', () => {
      const error = createRateLimitError(1, 15, 10);

      expect(error.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
      expect(error.details.limit).toBe(1);
      expect(error.details.windowSeconds).toBe(15);
      expect(error.details.retryAfter).toBe(10);
    });
  });

  describe('createResourceNotFoundError', () => {
    it('should create a resource not found error', () => {
      const error = createResourceNotFoundError(
        'CV',
        'cv-123',
        ErrorCode.CV_NOT_FOUND
      );

      expect(error.code).toBe(ErrorCode.CV_NOT_FOUND);
      expect(error.details.resourceType).toBe('CV');
      expect(error.details.resourceId).toBe('cv-123');
    });
  });

  describe('formatErrorResponse', () => {
    it('should format error for API response', () => {
      const error = createError(ErrorCode.INVALID_CREDENTIALS);
      const response = formatErrorResponse(error);

      expect(response.success).toBe(false);
      expect(response.error.code).toBe(ErrorCode.INVALID_CREDENTIALS);
      expect(response.error.message).toBe(
        ErrorMessages[ErrorCode.INVALID_CREDENTIALS]
      );
      expect(response.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('ErrorHttpStatusMap', () => {
    it('should map validation errors to 400', () => {
      expect(ErrorHttpStatusMap[ErrorCode.VALIDATION_ERROR]).toBe(400);
      expect(ErrorHttpStatusMap[ErrorCode.INVALID_FILE_FORMAT]).toBe(400);
    });

    it('should map auth errors to 401', () => {
      expect(ErrorHttpStatusMap[ErrorCode.INVALID_CREDENTIALS]).toBe(401);
      expect(ErrorHttpStatusMap[ErrorCode.TOKEN_EXPIRED]).toBe(401);
    });

    it('should map not found errors to 404', () => {
      expect(ErrorHttpStatusMap[ErrorCode.USER_NOT_FOUND]).toBe(404);
      expect(ErrorHttpStatusMap[ErrorCode.CV_NOT_FOUND]).toBe(404);
    });

    it('should map rate limit errors to 429', () => {
      expect(ErrorHttpStatusMap[ErrorCode.RATE_LIMIT_EXCEEDED]).toBe(429);
    });

    it('should map server errors to 500', () => {
      expect(ErrorHttpStatusMap[ErrorCode.INTERNAL_SERVER_ERROR]).toBe(500);
      expect(ErrorHttpStatusMap[ErrorCode.DATABASE_ERROR]).toBe(500);
    });
  });

  describe('ErrorMessages', () => {
    it('should have user-friendly messages for all error codes', () => {
      Object.values(ErrorCode).forEach((code) => {
        expect(ErrorMessages[code]).toBeDefined();
        expect(ErrorMessages[code].length).toBeGreaterThan(0);
      });
    });
  });
});
