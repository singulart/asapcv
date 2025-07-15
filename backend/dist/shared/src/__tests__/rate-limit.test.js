"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rate_limit_1 = require("../types/rate-limit");
describe('Rate Limiting', () => {
    describe('RATE_LIMIT_CONFIGS', () => {
        it('should have configurations for critical endpoints', () => {
            expect(rate_limit_1.RATE_LIMIT_CONFIGS['POST:/job/analyze']).toBeDefined();
            expect(rate_limit_1.RATE_LIMIT_CONFIGS['POST:/cv/tailor']).toBeDefined();
            expect(rate_limit_1.RATE_LIMIT_CONFIGS['POST:/cv/upload']).toBeDefined();
            expect(rate_limit_1.RATE_LIMIT_CONFIGS['POST:/auth/login']).toBeDefined();
            expect(rate_limit_1.RATE_LIMIT_CONFIGS['POST:/auth/register']).toBeDefined();
        });
        it('should have proper structure for each config', () => {
            const config = rate_limit_1.RATE_LIMIT_CONFIGS['POST:/job/analyze'];
            expect(config.limit).toBe(1);
            expect(config.windowSeconds).toBe(15);
            expect(config.message).toContain('Job analysis limited');
        });
    });
    describe('generateRateLimitKey', () => {
        it('should generate consistent keys', () => {
            const key1 = (0, rate_limit_1.generateRateLimitKey)('user123', '/job/analyze', 'POST');
            const key2 = (0, rate_limit_1.generateRateLimitKey)('user123', '/job/analyze', 'POST');
            expect(key1).toBe(key2);
            expect(key1).toBe('rate_limit:user123:POST:/job/analyze');
        });
        it('should generate different keys for different users', () => {
            const key1 = (0, rate_limit_1.generateRateLimitKey)('user123', '/job/analyze', 'POST');
            const key2 = (0, rate_limit_1.generateRateLimitKey)('user456', '/job/analyze', 'POST');
            expect(key1).not.toBe(key2);
        });
    });
    describe('generateGlobalRateLimitKey', () => {
        it('should generate global rate limit keys', () => {
            const key = (0, rate_limit_1.generateGlobalRateLimitKey)('/job/analyze', 'POST');
            expect(key).toBe('global_rate_limit:POST:/job/analyze');
        });
    });
    describe('calculateRemainingRequests', () => {
        it('should calculate remaining requests correctly', () => {
            expect((0, rate_limit_1.calculateRemainingRequests)(3, 5)).toBe(2);
            expect((0, rate_limit_1.calculateRemainingRequests)(5, 5)).toBe(0);
            expect((0, rate_limit_1.calculateRemainingRequests)(7, 5)).toBe(0);
        });
    });
    describe('calculateResetTime', () => {
        it('should calculate reset time correctly', () => {
            const windowStart = new Date('2023-01-01T10:00:00Z');
            const windowSeconds = 60;
            const resetTime = (0, rate_limit_1.calculateResetTime)(windowStart, windowSeconds);
            expect(resetTime).toEqual(new Date('2023-01-01T10:01:00Z'));
        });
    });
    describe('calculateRetryAfter', () => {
        it('should calculate retry after seconds correctly', () => {
            const resetTime = new Date('2023-01-01T10:01:00Z');
            const now = new Date('2023-01-01T10:00:30Z');
            const retryAfter = (0, rate_limit_1.calculateRetryAfter)(resetTime, now);
            expect(retryAfter).toBe(30);
        });
        it('should return 0 if reset time has passed', () => {
            const resetTime = new Date('2023-01-01T10:00:00Z');
            const now = new Date('2023-01-01T10:01:00Z');
            const retryAfter = (0, rate_limit_1.calculateRetryAfter)(resetTime, now);
            expect(retryAfter).toBe(0);
        });
    });
    describe('isWithinWindow', () => {
        it('should return true if within window', () => {
            const windowStart = new Date('2023-01-01T10:00:00Z');
            const windowSeconds = 60;
            const now = new Date('2023-01-01T10:00:30Z');
            expect((0, rate_limit_1.isWithinWindow)(windowStart, windowSeconds, now)).toBe(true);
        });
        it('should return false if outside window', () => {
            const windowStart = new Date('2023-01-01T10:00:00Z');
            const windowSeconds = 60;
            const now = new Date('2023-01-01T10:02:00Z');
            expect((0, rate_limit_1.isWithinWindow)(windowStart, windowSeconds, now)).toBe(false);
        });
    });
});
