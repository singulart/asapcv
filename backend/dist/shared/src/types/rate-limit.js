"use strict";
// Rate limiting types and configurations
Object.defineProperty(exports, "__esModule", { value: true });
exports.GLOBAL_RATE_LIMITS = exports.RATE_LIMIT_HEADERS = exports.isWithinWindow = exports.calculateRetryAfter = exports.calculateResetTime = exports.calculateRemainingRequests = exports.generateGlobalRateLimitKey = exports.generateRateLimitKey = exports.RATE_LIMIT_CONFIGS = void 0;
// Rate limit configurations for different endpoints
exports.RATE_LIMIT_CONFIGS = {
    'POST:/job/analyze': {
        limit: 1,
        windowSeconds: 15,
        message: 'Job analysis limited to 1 request per 15 seconds to ensure quality processing.',
    },
    'POST:/cv/tailor': {
        limit: 1,
        windowSeconds: 15,
        message: 'CV tailoring limited to 1 request per 15 seconds to ensure quality processing.',
    },
    'POST:/cv/upload': {
        limit: 5,
        windowSeconds: 60,
        message: 'CV uploads limited to 5 files per minute.',
    },
    'POST:/auth/login': {
        limit: 5,
        windowSeconds: 300, // 5 minutes
        message: 'Login attempts limited to 5 per 5 minutes for security.',
    },
    'POST:/auth/register': {
        limit: 3,
        windowSeconds: 3600, // 1 hour
        message: 'Registration limited to 3 attempts per hour.',
    },
};
// Rate limit key generators
const generateRateLimitKey = (userId, endpoint, method) => {
    return `rate_limit:${userId}:${method}:${endpoint}`;
};
exports.generateRateLimitKey = generateRateLimitKey;
const generateGlobalRateLimitKey = (endpoint, method) => {
    return `global_rate_limit:${method}:${endpoint}`;
};
exports.generateGlobalRateLimitKey = generateGlobalRateLimitKey;
// Rate limit calculation utilities
const calculateRemainingRequests = (currentCount, limit) => {
    return Math.max(0, limit - currentCount);
};
exports.calculateRemainingRequests = calculateRemainingRequests;
const calculateResetTime = (windowStart, windowSeconds) => {
    return new Date(windowStart.getTime() + windowSeconds * 1000);
};
exports.calculateResetTime = calculateResetTime;
const calculateRetryAfter = (resetTime, now = new Date()) => {
    return Math.max(0, Math.ceil((resetTime.getTime() - now.getTime()) / 1000));
};
exports.calculateRetryAfter = calculateRetryAfter;
const isWithinWindow = (windowStart, windowSeconds, now = new Date()) => {
    const windowEnd = new Date(windowStart.getTime() + windowSeconds * 1000);
    return now <= windowEnd;
};
exports.isWithinWindow = isWithinWindow;
// Rate limit response headers
exports.RATE_LIMIT_HEADERS = {
    LIMIT: 'X-RateLimit-Limit',
    REMAINING: 'X-RateLimit-Remaining',
    RESET: 'X-RateLimit-Reset',
    RETRY_AFTER: 'Retry-After',
};
exports.GLOBAL_RATE_LIMITS = {
    requestsPerMinute: 100,
    requestsPerHour: 1000,
    requestsPerDay: 10000,
};
