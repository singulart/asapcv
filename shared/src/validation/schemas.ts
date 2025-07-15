import Joi from 'joi';

// Common validation patterns
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const urlPattern = /^https?:\/\/.+/;

// Authentication validation schemas
export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).max(128).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'string.max': 'Password cannot exceed 128 characters',
    'any.required': 'Password is required',
  }),
});

export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).max(128).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'string.max': 'Password cannot exceed 128 characters',
    'any.required': 'Password is required',
  }),
  fullName: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Full name must be at least 2 characters long',
    'string.max': 'Full name cannot exceed 100 characters',
    'any.required': 'Full name is required',
  }),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'Refresh token is required',
  }),
});

export const googleOAuthSchema = Joi.object({
  code: Joi.string().required().messages({
    'any.required': 'OAuth authorization code is required',
  }),
  state: Joi.string().optional(),
});

// Profile validation schemas
export const updateProfileSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Full name must be at least 2 characters long',
    'string.max': 'Full name cannot exceed 100 characters',
  }),
  email: Joi.string().email().optional().messages({
    'string.email': 'Please provide a valid email address',
  }),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update',
  });

// CV validation schemas
export const cvUploadSchema = Joi.object({
  title: Joi.string().min(1).max(200).optional().messages({
    'string.min': 'CV title cannot be empty',
    'string.max': 'CV title cannot exceed 200 characters',
  }),
});

export const cvIdParamSchema = Joi.object({
  id: Joi.string().pattern(uuidPattern).required().messages({
    'string.pattern.base': 'Invalid CV ID format',
    'any.required': 'CV ID is required',
  }),
});

// Job analysis validation schemas
export const jobAnalyzeSchema = Joi.object({
  jobUrl: Joi.string().pattern(urlPattern).required().messages({
    'string.pattern.base': 'Please provide a valid HTTP/HTTPS URL',
    'any.required': 'Job URL is required',
  }),
});

// CV tailoring validation schemas
export const cvTailorSchema = Joi.object({
  jobUrl: Joi.string().pattern(urlPattern).required().messages({
    'string.pattern.base': 'Please provide a valid HTTP/HTTPS URL',
    'any.required': 'Job URL is required',
  }),
  baseCvId: Joi.string().pattern(uuidPattern).optional().messages({
    'string.pattern.base': 'Invalid base CV ID format',
  }),
});

// CV download validation schemas
export const cvDownloadSchema = Joi.object({
  format: Joi.string().valid('pdf', 'docx').optional().default('pdf').messages({
    'any.only': 'Format must be either "pdf" or "docx"',
  }),
});

// Email processing validation schemas (internal)
export const emailProcessSchema = Joi.object({
  messageId: Joi.string().required().messages({
    'any.required': 'Message ID is required',
  }),
  from: Joi.string().email().required().messages({
    'string.email': 'Invalid sender email address',
    'any.required': 'Sender email is required',
  }),
  subject: Joi.string().max(500).required().messages({
    'string.max': 'Subject cannot exceed 500 characters',
    'any.required': 'Email subject is required',
  }),
  body: Joi.string().max(50000).required().messages({
    'string.max': 'Email body cannot exceed 50,000 characters',
    'any.required': 'Email body is required',
  }),
  timestamp: Joi.date().required().messages({
    'any.required': 'Email timestamp is required',
  }),
});

// File upload validation
export const fileUploadSchema = Joi.object({
  filename: Joi.string().required().messages({
    'any.required': 'Filename is required',
  }),
  mimetype: Joi.string()
    .valid(
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
    .required()
    .messages({
      'any.only': 'File must be PDF, DOC, or DOCX format',
      'any.required': 'File type is required',
    }),
  size: Joi.number()
    .max(10 * 1024 * 1024)
    .required()
    .messages({
      'number.max': 'File size cannot exceed 10MB',
      'any.required': 'File size is required',
    }),
});

// Validation helper functions
export const validateRequest = <T>(
  schema: Joi.ObjectSchema,
  data: any
): { error?: string; value?: T } => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join('; ');
    return { error: errorMessage };
  }

  return { value };
};

export const validatePathParams = (schema: Joi.ObjectSchema, params: any) => {
  return validateRequest(schema, params);
};

export const validateQueryParams = (schema: Joi.ObjectSchema, query: any) => {
  return validateRequest(schema, query);
};
