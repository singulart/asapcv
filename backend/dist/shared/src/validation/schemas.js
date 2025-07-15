"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQueryParams = exports.validatePathParams = exports.validateRequest = exports.fileUploadSchema = exports.emailProcessSchema = exports.cvDownloadSchema = exports.cvTailorSchema = exports.jobAnalyzeSchema = exports.cvIdParamSchema = exports.cvUploadSchema = exports.updateProfileSchema = exports.googleOAuthSchema = exports.refreshTokenSchema = exports.registerSchema = exports.loginSchema = void 0;
const joi_1 = __importDefault(require("joi"));
// Common validation patterns
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const urlPattern = /^https?:\/\/.+/;
// Authentication validation schemas
exports.loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
    }),
    password: joi_1.default.string().min(6).max(128).required().messages({
        'string.min': 'Password must be at least 6 characters long',
        'string.max': 'Password cannot exceed 128 characters',
        'any.required': 'Password is required',
    }),
});
exports.registerSchema = joi_1.default.object({
    email: joi_1.default.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
    }),
    password: joi_1.default.string().min(6).max(128).required().messages({
        'string.min': 'Password must be at least 6 characters long',
        'string.max': 'Password cannot exceed 128 characters',
        'any.required': 'Password is required',
    }),
    fullName: joi_1.default.string().min(2).max(100).required().messages({
        'string.min': 'Full name must be at least 2 characters long',
        'string.max': 'Full name cannot exceed 100 characters',
        'any.required': 'Full name is required',
    }),
});
exports.refreshTokenSchema = joi_1.default.object({
    refreshToken: joi_1.default.string().required().messages({
        'any.required': 'Refresh token is required',
    }),
});
exports.googleOAuthSchema = joi_1.default.object({
    code: joi_1.default.string().required().messages({
        'any.required': 'OAuth authorization code is required',
    }),
    state: joi_1.default.string().optional(),
});
// Profile validation schemas
exports.updateProfileSchema = joi_1.default.object({
    fullName: joi_1.default.string().min(2).max(100).optional().messages({
        'string.min': 'Full name must be at least 2 characters long',
        'string.max': 'Full name cannot exceed 100 characters',
    }),
    email: joi_1.default.string().email().optional().messages({
        'string.email': 'Please provide a valid email address',
    }),
})
    .min(1)
    .messages({
    'object.min': 'At least one field must be provided for update',
});
// CV validation schemas
exports.cvUploadSchema = joi_1.default.object({
    title: joi_1.default.string().min(1).max(200).optional().messages({
        'string.min': 'CV title cannot be empty',
        'string.max': 'CV title cannot exceed 200 characters',
    }),
});
exports.cvIdParamSchema = joi_1.default.object({
    id: joi_1.default.string().pattern(uuidPattern).required().messages({
        'string.pattern.base': 'Invalid CV ID format',
        'any.required': 'CV ID is required',
    }),
});
// Job analysis validation schemas
exports.jobAnalyzeSchema = joi_1.default.object({
    jobUrl: joi_1.default.string().pattern(urlPattern).required().messages({
        'string.pattern.base': 'Please provide a valid HTTP/HTTPS URL',
        'any.required': 'Job URL is required',
    }),
});
// CV tailoring validation schemas
exports.cvTailorSchema = joi_1.default.object({
    jobUrl: joi_1.default.string().pattern(urlPattern).required().messages({
        'string.pattern.base': 'Please provide a valid HTTP/HTTPS URL',
        'any.required': 'Job URL is required',
    }),
    baseCvId: joi_1.default.string().pattern(uuidPattern).optional().messages({
        'string.pattern.base': 'Invalid base CV ID format',
    }),
});
// CV download validation schemas
exports.cvDownloadSchema = joi_1.default.object({
    format: joi_1.default.string().valid('pdf', 'docx').optional().default('pdf').messages({
        'any.only': 'Format must be either "pdf" or "docx"',
    }),
});
// Email processing validation schemas (internal)
exports.emailProcessSchema = joi_1.default.object({
    messageId: joi_1.default.string().required().messages({
        'any.required': 'Message ID is required',
    }),
    from: joi_1.default.string().email().required().messages({
        'string.email': 'Invalid sender email address',
        'any.required': 'Sender email is required',
    }),
    subject: joi_1.default.string().max(500).required().messages({
        'string.max': 'Subject cannot exceed 500 characters',
        'any.required': 'Email subject is required',
    }),
    body: joi_1.default.string().max(50000).required().messages({
        'string.max': 'Email body cannot exceed 50,000 characters',
        'any.required': 'Email body is required',
    }),
    timestamp: joi_1.default.date().required().messages({
        'any.required': 'Email timestamp is required',
    }),
});
// File upload validation
exports.fileUploadSchema = joi_1.default.object({
    filename: joi_1.default.string().required().messages({
        'any.required': 'Filename is required',
    }),
    mimetype: joi_1.default.string()
        .valid('application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        .required()
        .messages({
        'any.only': 'File must be PDF, DOC, or DOCX format',
        'any.required': 'File type is required',
    }),
    size: joi_1.default.number()
        .max(10 * 1024 * 1024)
        .required()
        .messages({
        'number.max': 'File size cannot exceed 10MB',
        'any.required': 'File size is required',
    }),
});
// Validation helper functions
const validateRequest = (schema, data) => {
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
exports.validateRequest = validateRequest;
const validatePathParams = (schema, params) => {
    return (0, exports.validateRequest)(schema, params);
};
exports.validatePathParams = validatePathParams;
const validateQueryParams = (schema, query) => {
    return (0, exports.validateRequest)(schema, query);
};
exports.validateQueryParams = validateQueryParams;
