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
    ttl: number;
}
export declare const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig>;
export declare const generateRateLimitKey: (userId: string, endpoint: string, method: string) => string;
export declare const generateGlobalRateLimitKey: (endpoint: string, method: string) => string;
export declare const calculateRemainingRequests: (currentCount: number, limit: number) => number;
export declare const calculateResetTime: (windowStart: Date, windowSeconds: number) => Date;
export declare const calculateRetryAfter: (resetTime: Date, now?: Date) => number;
export declare const isWithinWindow: (windowStart: Date, windowSeconds: number, now?: Date) => boolean;
export declare const RATE_LIMIT_HEADERS: {
    readonly LIMIT: "X-RateLimit-Limit";
    readonly REMAINING: "X-RateLimit-Remaining";
    readonly RESET: "X-RateLimit-Reset";
    readonly RETRY_AFTER: "Retry-After";
};
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
export interface RateLimitTableItem {
    pk: string;
    sk: string;
    requestCount: number;
    windowStart: string;
    lastRequest: string;
    ttl: number;
}
export interface IRateLimitService {
    checkRateLimit(userId: string, endpoint: string, method: string): Promise<RateLimitResult>;
    incrementCounter(userId: string, endpoint: string, method: string): Promise<RateLimitStatus>;
    getRateLimitStatus(userId: string, endpoint: string, method: string): Promise<RateLimitStatus>;
    resetRateLimit(userId: string, endpoint: string, method: string): Promise<void>;
}
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
export interface GlobalRateLimitConfig {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
}
export declare const GLOBAL_RATE_LIMITS: GlobalRateLimitConfig;
