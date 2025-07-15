import {
  loginSchema,
  registerSchema,
  jobAnalyzeSchema,
  cvTailorSchema,
  updateProfileSchema,
  validateRequest,
} from '../validation/schemas';

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const { error, value } = validateRequest(loginSchema, validData);
      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      };

      const { error } = validateRequest(loginSchema, invalidData);
      expect(error).toContain('valid email address');
    });

    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123',
      };

      const { error } = validateRequest(loginSchema, invalidData);
      expect(error).toContain('at least 6 characters');
    });
  });

  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'John Doe',
      };

      const { error, value } = validateRequest(registerSchema, validData);
      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should reject short full name', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'A',
      };

      const { error } = validateRequest(registerSchema, invalidData);
      expect(error).toContain('at least 2 characters');
    });
  });

  describe('jobAnalyzeSchema', () => {
    it('should validate correct job URL', () => {
      const validData = {
        jobUrl: 'https://example.com/job/123',
      };

      const { error, value } = validateRequest(jobAnalyzeSchema, validData);
      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should reject invalid URL', () => {
      const invalidData = {
        jobUrl: 'not-a-url',
      };

      const { error } = validateRequest(jobAnalyzeSchema, invalidData);
      expect(error).toContain('valid HTTP/HTTPS URL');
    });
  });

  describe('cvTailorSchema', () => {
    it('should validate correct tailoring data', () => {
      const validData = {
        jobUrl: 'https://example.com/job/123',
        baseCvId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const { error, value } = validateRequest(cvTailorSchema, validData);
      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should validate without baseCvId', () => {
      const validData = {
        jobUrl: 'https://example.com/job/123',
      };

      const { error, value } = validateRequest(cvTailorSchema, validData);
      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should reject invalid UUID format for baseCvId', () => {
      const invalidData = {
        jobUrl: 'https://example.com/job/123',
        baseCvId: 'invalid-uuid',
      };

      const { error } = validateRequest(cvTailorSchema, invalidData);
      expect(error).toContain('Invalid base CV ID format');
    });
  });

  describe('updateProfileSchema', () => {
    it('should validate profile update with fullName', () => {
      const validData = {
        fullName: 'Jane Doe',
      };

      const { error, value } = validateRequest(updateProfileSchema, validData);
      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should validate profile update with email', () => {
      const validData = {
        email: 'newemail@example.com',
      };

      const { error, value } = validateRequest(updateProfileSchema, validData);
      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should reject empty update', () => {
      const invalidData = {};

      const { error } = validateRequest(updateProfileSchema, invalidData);
      expect(error).toContain('At least one field must be provided');
    });
  });
});
