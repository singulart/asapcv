// Standardized error handling types and utilities

export enum ErrorCode {
  // Authentication errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_FILE_FORMAT = 'INVALID_FILE_FORMAT',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_URL = 'INVALID_URL',

  // Resource errors
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  CV_NOT_FOUND = 'CV_NOT_FOUND',
  JOB_NOT_FOUND = 'JOB_NOT_FOUND',
  EMAIL_REQUEST_NOT_FOUND = 'EMAIL_REQUEST_NOT_FOUND',

  // Business logic errors
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  BASE_CV_REQUIRED = 'BASE_CV_REQUIRED',
  CANNOT_DELETE_BASE_CV = 'CANNOT_DELETE_BASE_CV',
  JOB_CONTENT_INSUFFICIENT = 'JOB_CONTENT_INSUFFICIENT',

  // Rate limiting errors
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',

  // External service errors
  JOB_FETCH_FAILED = 'JOB_FETCH_FAILED',
  CV_PROCESSING_FAILED = 'CV_PROCESSING_FAILED',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  EMAIL_SEND_FAILED = 'EMAIL_SEND_FAILED',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',

  // System errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

export interface ErrorDetails {
  field?: string;
  value?: any;
  constraint?: string;
  context?: Record<string, any>;
}

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: ErrorDetails;
  timestamp: Date;
  requestId?: string;
  userId?: string;
}

export interface ValidationError extends AppError {
  code: ErrorCode.VALIDATION_ERROR;
  details: {
    field: string;
    value: any;
    constraint: string;
    context?: Record<string, any>;
  };
}

export interface RateLimitError extends AppError {
  code: ErrorCode.RATE_LIMIT_EXCEEDED | ErrorCode.TOO_MANY_REQUESTS;
  details: {
    limit: number;
    windowSeconds: number;
    retryAfter: number;
    context?: Record<string, any>;
  };
}

export interface ResourceNotFoundError extends AppError {
  code:
    | ErrorCode.USER_NOT_FOUND
    | ErrorCode.CV_NOT_FOUND
    | ErrorCode.JOB_NOT_FOUND
    | ErrorCode.EMAIL_REQUEST_NOT_FOUND;
  details: {
    resourceType: string;
    resourceId: string;
    context?: Record<string, any>;
  };
}

// HTTP status code mappings
export const ErrorHttpStatusMap: Record<ErrorCode, number> = {
  // 400 Bad Request
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_FILE_FORMAT]: 400,
  [ErrorCode.FILE_TOO_LARGE]: 400,
  [ErrorCode.INVALID_URL]: 400,
  [ErrorCode.BASE_CV_REQUIRED]: 400,
  [ErrorCode.CANNOT_DELETE_BASE_CV]: 400,
  [ErrorCode.JOB_CONTENT_INSUFFICIENT]: 400,

  // 401 Unauthorized
  [ErrorCode.INVALID_CREDENTIALS]: 401,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  [ErrorCode.TOKEN_INVALID]: 401,
  [ErrorCode.UNAUTHORIZED]: 401,

  // 403 Forbidden
  [ErrorCode.FORBIDDEN]: 403,

  // 404 Not Found
  [ErrorCode.USER_NOT_FOUND]: 404,
  [ErrorCode.CV_NOT_FOUND]: 404,
  [ErrorCode.JOB_NOT_FOUND]: 404,
  [ErrorCode.EMAIL_REQUEST_NOT_FOUND]: 404,

  // 409 Conflict
  [ErrorCode.USER_ALREADY_EXISTS]: 409,

  // 429 Too Many Requests
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.TOO_MANY_REQUESTS]: 429,

  // 500 Internal Server Error
  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.AI_SERVICE_ERROR]: 500,

  // 502 Bad Gateway
  [ErrorCode.JOB_FETCH_FAILED]: 502,
  [ErrorCode.CV_PROCESSING_FAILED]: 502,
  [ErrorCode.EMAIL_SEND_FAILED]: 502,
  [ErrorCode.FILE_UPLOAD_FAILED]: 502,

  // 503 Service Unavailable
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.NETWORK_ERROR]: 503,
};

// User-friendly error messages
export const ErrorMessages: Record<ErrorCode, string> = {
  // Authentication errors
  [ErrorCode.INVALID_CREDENTIALS]:
    'Invalid email or password. Please check your credentials and try again.',
  [ErrorCode.TOKEN_EXPIRED]: 'Your session has expired. Please log in again.',
  [ErrorCode.TOKEN_INVALID]:
    'Invalid authentication token. Please log in again.',
  [ErrorCode.UNAUTHORIZED]: 'You must be logged in to access this resource.',
  [ErrorCode.FORBIDDEN]: 'You do not have permission to access this resource.',

  // Validation errors
  [ErrorCode.VALIDATION_ERROR]:
    'The provided data is invalid. Please check your input and try again.',
  [ErrorCode.INVALID_FILE_FORMAT]:
    'Invalid file format. Please upload a PDF, DOC, or DOCX file.',
  [ErrorCode.FILE_TOO_LARGE]:
    'File size exceeds the 10MB limit. Please upload a smaller file.',
  [ErrorCode.INVALID_URL]:
    'Invalid URL format. Please provide a valid HTTP or HTTPS URL.',

  // Resource errors
  [ErrorCode.USER_NOT_FOUND]:
    'User account not found. Please check your credentials or create a new account.',
  [ErrorCode.CV_NOT_FOUND]:
    'CV not found. It may have been deleted or you may not have permission to access it.',
  [ErrorCode.JOB_NOT_FOUND]:
    'Job analysis not found. Please try analyzing the job URL again.',
  [ErrorCode.EMAIL_REQUEST_NOT_FOUND]:
    'Email request not found or has expired.',

  // Business logic errors
  [ErrorCode.USER_ALREADY_EXISTS]:
    'An account with this email address already exists. Please log in or use a different email.',
  [ErrorCode.BASE_CV_REQUIRED]:
    'You must upload a base CV before tailoring. Please upload your CV first.',
  [ErrorCode.CANNOT_DELETE_BASE_CV]:
    'Cannot delete your base CV. Please create a backup version first.',
  [ErrorCode.JOB_CONTENT_INSUFFICIENT]:
    'Unable to extract sufficient job information from the provided URL. Please try a different job posting URL.',

  // Rate limiting errors
  [ErrorCode.RATE_LIMIT_EXCEEDED]:
    'You have exceeded the rate limit. Please wait before making another request.',
  [ErrorCode.TOO_MANY_REQUESTS]:
    'Too many requests. Please slow down and try again later.',

  // External service errors
  [ErrorCode.JOB_FETCH_FAILED]:
    'Unable to fetch job description from the provided URL. Please check the URL and try again.',
  [ErrorCode.CV_PROCESSING_FAILED]:
    'Failed to process your CV. Please try uploading again or contact support.',
  [ErrorCode.AI_SERVICE_ERROR]:
    'AI service is temporarily unavailable. Please try again in a few moments.',
  [ErrorCode.EMAIL_SEND_FAILED]:
    'Failed to send email. Please try again or contact support.',
  [ErrorCode.FILE_UPLOAD_FAILED]:
    'File upload failed. Please check your connection and try again.',

  // System errors
  [ErrorCode.INTERNAL_SERVER_ERROR]:
    'An unexpected error occurred. Please try again or contact support if the problem persists.',
  [ErrorCode.DATABASE_ERROR]:
    'Database error occurred. Please try again or contact support.',
  [ErrorCode.NETWORK_ERROR]:
    'Network error occurred. Please check your connection and try again.',
  [ErrorCode.SERVICE_UNAVAILABLE]:
    'Service is temporarily unavailable. Please try again later.',
};

// Error factory functions
export const createError = (
  code: ErrorCode,
  message?: string,
  details?: ErrorDetails,
  requestId?: string,
  userId?: string
): AppError => ({
  code,
  message: message || ErrorMessages[code],
  details,
  timestamp: new Date(),
  requestId,
  userId,
});

export const createValidationError = (
  field: string,
  value: any,
  constraint: string,
  context?: Record<string, any>,
  requestId?: string,
  userId?: string
): ValidationError => ({
  code: ErrorCode.VALIDATION_ERROR,
  message: ErrorMessages[ErrorCode.VALIDATION_ERROR],
  details: { field, value, constraint, context },
  timestamp: new Date(),
  requestId,
  userId,
});

export const createRateLimitError = (
  limit: number,
  windowSeconds: number,
  retryAfter: number,
  requestId?: string,
  userId?: string
): RateLimitError => ({
  code: ErrorCode.RATE_LIMIT_EXCEEDED,
  message: ErrorMessages[ErrorCode.RATE_LIMIT_EXCEEDED],
  details: { limit, windowSeconds, retryAfter },
  timestamp: new Date(),
  requestId,
  userId,
});

export const createResourceNotFoundError = (
  resourceType: string,
  resourceId: string,
  code:
    | ErrorCode.USER_NOT_FOUND
    | ErrorCode.CV_NOT_FOUND
    | ErrorCode.JOB_NOT_FOUND
    | ErrorCode.EMAIL_REQUEST_NOT_FOUND,
  requestId?: string,
  userId?: string
): ResourceNotFoundError => ({
  code,
  message: ErrorMessages[code],
  details: { resourceType, resourceId },
  timestamp: new Date(),
  requestId,
  userId,
});

// Error response formatter for API responses
export const formatErrorResponse = (error: AppError) => ({
  success: false,
  error: {
    code: error.code,
    message: error.message,
    details: error.details,
    timestamp: error.timestamp,
  },
  timestamp: new Date(),
});

// Error logging helper
export const logError = (error: AppError, context?: Record<string, any>) => {
  const logData = {
    ...error,
    context,
    level: getErrorLogLevel(error.code),
  };

  // In a real implementation, this would use a proper logging service
  console.error('Application Error:', JSON.stringify(logData, null, 2));
};

const getErrorLogLevel = (code: ErrorCode): 'error' | 'warn' | 'info' => {
  const errorCodes = [
    ErrorCode.INTERNAL_SERVER_ERROR,
    ErrorCode.DATABASE_ERROR,
    ErrorCode.AI_SERVICE_ERROR,
  ];

  const warnCodes = [
    ErrorCode.JOB_FETCH_FAILED,
    ErrorCode.CV_PROCESSING_FAILED,
    ErrorCode.EMAIL_SEND_FAILED,
    ErrorCode.FILE_UPLOAD_FAILED,
  ];

  if (errorCodes.includes(code)) return 'error';
  if (warnCodes.includes(code)) return 'warn';
  return 'info';
};
