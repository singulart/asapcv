import Joi from 'joi';
export declare const loginSchema: Joi.ObjectSchema<any>;
export declare const registerSchema: Joi.ObjectSchema<any>;
export declare const refreshTokenSchema: Joi.ObjectSchema<any>;
export declare const googleOAuthSchema: Joi.ObjectSchema<any>;
export declare const updateProfileSchema: Joi.ObjectSchema<any>;
export declare const cvUploadSchema: Joi.ObjectSchema<any>;
export declare const cvIdParamSchema: Joi.ObjectSchema<any>;
export declare const jobAnalyzeSchema: Joi.ObjectSchema<any>;
export declare const cvTailorSchema: Joi.ObjectSchema<any>;
export declare const cvDownloadSchema: Joi.ObjectSchema<any>;
export declare const emailProcessSchema: Joi.ObjectSchema<any>;
export declare const fileUploadSchema: Joi.ObjectSchema<any>;
export declare const validateRequest: <T>(schema: Joi.ObjectSchema, data: any) => {
    error?: string;
    value?: T;
};
export declare const validatePathParams: (schema: Joi.ObjectSchema, params: any) => {
    error?: string;
    value?: unknown;
};
export declare const validateQueryParams: (schema: Joi.ObjectSchema, query: any) => {
    error?: string;
    value?: unknown;
};
