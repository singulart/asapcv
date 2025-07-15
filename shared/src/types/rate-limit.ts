// Rate limiting types and configurations

export interface RateLimitConfig {
    limit: number;
    windowSeconds: number;
    message: string;
}

export interface RateLimitRule {
    endpoint: string;
    method: string;
    config: RateLimitConfig;
}

export interface RateLimitStatus {
    limit: number;
    remaining: number;
    resetTime: Date;
    retryAfter?: number;
}

export interface RateLimitRecord {
    userId: string;
    endpoint: string;
    requestCount: number;
    windowStart: Date;
    lastRequest: Date;
    ttl: number; // Time to live in seconds
}

// Rate limit configurations for different endpoints
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
    'POST:/job/analyze': {
        limit: 1,
        windowSeconds: 15,
        message:
            'Job analysis limited to 1 request per 15 seconds to ensure quality processing.',
    },
    'POST:/cv/tailor': {
        limit: 1,
        windowSeconds: 15,
        message:
            'CV tailoring limited to 1 request per 15 seconds to ensure quality processing.',
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
export const generateRateLimitKey = (
    userId: string,
    endpoint: string,
    method: string
): string => {
    return `rate_limit:${userId}:${method}:${endpoint}`;
};

export const generateGlobalRateLimitKey = (
    endpoint: string,
    method: string
): string => {
    return `global_rate_limit:${method}:${endpoint}`;
};

// Rate limit calculation utilities
export const calculateRemainingRequests = (
    currentCount: number,
    limit: number
): number => {
    return Math.max(0, limit - currentCount);
};

export const calculateResetTime = (
    windowStart: Date,
    windowSeconds: number
): Date => {
    return new Date(windowStart.getTime() + windowSeconds * 1000);
};

export const calculateRetryAfter = (
    resetTime: Date,
    now: Date = new Date()
): number => {
    return Math.max(0, Math.ceil((resetTime.getTime() - now.getTime()) / 1000));
};

export const isWithinWindow = (
    windowStart: Date,
    windowSeconds: number,
    now: Date = new Date()
): boolean => {
    const windowEnd = new Date(windowStart.getTime() + windowSeconds * 1000);
    return now <= windowEnd;
};

// Rate limit response headers
export const RATE_LIMIT_HEADERS = {
    LIMIT: 'X-RateLimit-Limit',
    REMAINING: 'X-RateLimit-Remaining',
    RESET: 'X-RateLimit-Reset',
    RETRY_AFTER: 'Retry-After',
} as const;

// Rate limit middleware types
export interface RateLimitMiddlewareOptions {
    keyGenerator?: (userId: string, endpoint: string, method: string) => string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    onLimitReached?: (userId: string, endpoint: string) => void;
}

export interface RateLimitResult {
    allowed: boolean;
    status: RateLimitStatus;
    error?: {
        code: string;
        message: string;
        retryAfter: number;
    };
}

// DynamoDB table structure for rate limiting
export interface RateLimitTableItem {
    pk: string; // Partition key: rate_limit:{userId}:{method}:{endpoint}
    sk: string; // Sort key: timestamp or 'current'
    requestCount: number;
    windowStart: string; // ISO string
    lastRequest: string; // ISO string
    ttl: number; // Unix timestamp for DynamoDB TTL
}

// Rate limiting service interface
export interface IRateLimitService {
    checkRateLimit(
        userId: string,
        endpoint: string,
        method: string
    ): Promise<RateLimitResult>;

    incrementCounter(
        userId: string,
        endpoint: string,
        method: string
    ): Promise<RateLimitStatus>;

    getRateLimitStatus(
        userId: string,
        endpoint: string,
        method: string
    ): Promise<RateLimitStatus>;

    resetRateLimit(
        userId: string,
        endpoint: string,
        method: string
    ): Promise<void>;
}

// Rate limit event types for monitoring
export interface RateLimitEvent {
    type: 'limit_exceeded' | 'limit_reset' | 'limit_checked';
    userId: string;
    endpoint: string;
    method: string;
    timestamp: Date;
    metadata?: {
        currentCount?: number;
        limit?: number;
        retryAfter?: number;
    };
}

// Global rate limiting (for abuse prevention)
export interface GlobalRateLimitConfig {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
}

export const GLOBAL_RATE_LIMITS: GlobalRateLimitConfig = {
    requestsPerMinute: 100,
    requestsPerHour: 1000,
    requestsPerDay: 10000,
};
