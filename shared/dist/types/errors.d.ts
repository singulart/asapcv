export declare enum ErrorCode {
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
    TOKEN_EXPIRED = "TOKEN_EXPIRED",
    TOKEN_INVALID = "TOKEN_INVALID",
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    INVALID_FILE_FORMAT = "INVALID_FILE_FORMAT",
    FILE_TOO_LARGE = "FILE_TOO_LARGE",
    INVALID_URL = "INVALID_URL",
    USER_NOT_FOUND = "USER_NOT_FOUND",
    CV_NOT_FOUND = "CV_NOT_FOUND",
    JOB_NOT_FOUND = "JOB_NOT_FOUND",
    EMAIL_REQUEST_NOT_FOUND = "EMAIL_REQUEST_NOT_FOUND",
    USER_ALREADY_EXISTS = "USER_ALREADY_EXISTS",
    BASE_CV_REQUIRED = "BASE_CV_REQUIRED",
    CANNOT_DELETE_BASE_CV = "CANNOT_DELETE_BASE_CV",
    JOB_CONTENT_INSUFFICIENT = "JOB_CONTENT_INSUFFICIENT",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    TOO_MANY_REQUESTS = "TOO_MANY_REQUESTS",
    JOB_FETCH_FAILED = "JOB_FETCH_FAILED",
    CV_PROCESSING_FAILED = "CV_PROCESSING_FAILED",
    AI_SERVICE_ERROR = "AI_SERVICE_ERROR",
    EMAIL_SEND_FAILED = "EMAIL_SEND_FAILED",
    FILE_UPLOAD_FAILED = "FILE_UPLOAD_FAILED",
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
    DATABASE_ERROR = "DATABASE_ERROR",
    NETWORK_ERROR = "NETWORK_ERROR",
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
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
    code: ErrorCode.USER_NOT_FOUND | ErrorCode.CV_NOT_FOUND | ErrorCode.JOB_NOT_FOUND | ErrorCode.EMAIL_REQUEST_NOT_FOUND;
    details: {
        resourceType: string;
        resourceId: string;
        context?: Record<string, any>;
    };
}
export declare const ErrorHttpStatusMap: Record<ErrorCode, number>;
export declare const ErrorMessages: Record<ErrorCode, string>;
export declare const createError: (code: ErrorCode, message?: string, details?: ErrorDetails, requestId?: string, userId?: string) => AppError;
export declare const createValidationError: (field: string, value: any, constraint: string, context?: Record<string, any>, requestId?: string, userId?: string) => ValidationError;
export declare const createRateLimitError: (limit: number, windowSeconds: number, retryAfter: number, requestId?: string, userId?: string) => RateLimitError;
export declare const createResourceNotFoundError: (resourceType: string, resourceId: string, code: ErrorCode.USER_NOT_FOUND | ErrorCode.CV_NOT_FOUND | ErrorCode.JOB_NOT_FOUND | ErrorCode.EMAIL_REQUEST_NOT_FOUND, requestId?: string, userId?: string) => ResourceNotFoundError;
export declare const formatErrorResponse: (error: AppError) => {
    success: boolean;
    error: {
        code: ErrorCode;
        message: string;
        details: ErrorDetails | undefined;
        timestamp: Date;
    };
    timestamp: Date;
};
export declare const logError: (error: AppError, context?: Record<string, any>) => void;
