import {
  RATE_LIMIT_CONFIGS,
  generateRateLimitKey,
  generateGlobalRateLimitKey,
  calculateRemainingRequests,
  calculateResetTime,
  calculateRetryAfter,
  isWithinWindow,
} from '../types/rate-limit';

describe('Rate Limiting', () => {
  describe('RATE_LIMIT_CONFIGS', () => {
    it('should have configurations for critical endpoints', () => {
      expect(RATE_LIMIT_CONFIGS['POST:/job/analyze']).toBeDefined();
      expect(RATE_LIMIT_CONFIGS['POST:/cv/tailor']).toBeDefined();
      expect(RATE_LIMIT_CONFIGS['POST:/cv/upload']).toBeDefined();
      expect(RATE_LIMIT_CONFIGS['POST:/auth/login']).toBeDefined();
      expect(RATE_LIMIT_CONFIGS['POST:/auth/register']).toBeDefined();
    });

    it('should have proper structure for each config', () => {
      const config = RATE_LIMIT_CONFIGS['POST:/job/analyze'];
      expect(config.limit).toBe(1);
      expect(config.windowSeconds).toBe(15);
      expect(config.message).toContain('Job analysis limited');
    });
  });

  describe('generateRateLimitKey', () => {
    it('should generate consistent keys', () => {
      const key1 = generateRateLimitKey('user123', '/job/analyze', 'POST');
      const key2 = generateRateLimitKey('user123', '/job/analyze', 'POST');

      expect(key1).toBe(key2);
      expect(key1).toBe('rate_limit:user123:POST:/job/analyze');
    });

    it('should generate different keys for different users', () => {
      const key1 = generateRateLimitKey('user123', '/job/analyze', 'POST');
      const key2 = generateRateLimitKey('user456', '/job/analyze', 'POST');

      expect(key1).not.toBe(key2);
    });
  });

  describe('generateGlobalRateLimitKey', () => {
    it('should generate global rate limit keys', () => {
      const key = generateGlobalRateLimitKey('/job/analyze', 'POST');
      expect(key).toBe('global_rate_limit:POST:/job/analyze');
    });
  });

  describe('calculateRemainingRequests', () => {
    it('should calculate remaining requests correctly', () => {
      expect(calculateRemainingRequests(3, 5)).toBe(2);
      expect(calculateRemainingRequests(5, 5)).toBe(0);
      expect(calculateRemainingRequests(7, 5)).toBe(0);
    });
  });

  describe('calculateResetTime', () => {
    it('should calculate reset time correctly', () => {
      const windowStart = new Date('2023-01-01T10:00:00Z');
      const windowSeconds = 60;
      const resetTime = calculateResetTime(windowStart, windowSeconds);

      expect(resetTime).toEqual(new Date('2023-01-01T10:01:00Z'));
    });
  });

  describe('calculateRetryAfter', () => {
    it('should calculate retry after seconds correctly', () => {
      const resetTime = new Date('2023-01-01T10:01:00Z');
      const now = new Date('2023-01-01T10:00:30Z');
      const retryAfter = calculateRetryAfter(resetTime, now);

      expect(retryAfter).toBe(30);
    });

    it('should return 0 if reset time has passed', () => {
      const resetTime = new Date('2023-01-01T10:00:00Z');
      const now = new Date('2023-01-01T10:01:00Z');
      const retryAfter = calculateRetryAfter(resetTime, now);

      expect(retryAfter).toBe(0);
    });
  });

  describe('isWithinWindow', () => {
    it('should return true if within window', () => {
      const windowStart = new Date('2023-01-01T10:00:00Z');
      const windowSeconds = 60;
      const now = new Date('2023-01-01T10:00:30Z');

      expect(isWithinWindow(windowStart, windowSeconds, now)).toBe(true);
    });

    it('should return false if outside window', () => {
      const windowStart = new Date('2023-01-01T10:00:00Z');
      const windowSeconds = 60;
      const now = new Date('2023-01-01T10:02:00Z');

      expect(isWithinWindow(windowStart, windowSeconds, now)).toBe(false);
    });
  });
});
