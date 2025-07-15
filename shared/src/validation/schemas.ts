import Joi from 'joi';

// Validation schemas for API requests
export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  fullName: Joi.string().min(2).max(100).required(),
});

export const jobAnalyzeSchema = Joi.object({
  jobUrl: Joi.string().uri().required(),
});

export const cvTailorSchema = Joi.object({
  jobUrl: Joi.string().uri().required(),
  baseCvId: Joi.string().optional(),
});