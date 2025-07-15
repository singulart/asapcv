"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../services/auth");
const googleOAuth_1 = require("../services/googleOAuth");
const auth_2 = require("../middleware/auth");
const schemas_1 = require("asap-cv-shared/dist/validation/schemas");
const schemas_2 = require("asap-cv-shared/dist/validation/schemas");
const errors_1 = require("asap-cv-shared/dist/types/errors");
// Helper function to handle errors consistently
const handleError = (error, res, next) => {
    if (error && typeof error === 'object' && 'code' in error && Object.values(errors_1.ErrorCode).includes(error.code)) {
        const statusCode = errors_1.ErrorHttpStatusMap[error.code] || 500;
        return res.status(statusCode).json((0, errors_1.formatErrorResponse)(error));
    }
    next(error);
};
const router = (0, express_1.Router)();
exports.authRoutes = router;
const authService = new auth_1.AuthService();
// Initialize Google OAuth service if configured
let googleOAuthService = null;
try {
    if (googleOAuth_1.GoogleOAuthService.isConfigured()) {
        googleOAuthService = new googleOAuth_1.GoogleOAuthService();
    }
}
catch (error) {
    console.warn('Google OAuth service initialization failed:', error);
}
// Apply security headers to all routes
router.use(auth_2.securityHeaders);
// POST /api/auth/login
router.post('/login', (0, auth_2.authRateLimit)(5, 15), async (req, res, next) => {
    try {
        // Validate request body
        const { error, value } = (0, schemas_1.validateRequest)(schemas_2.loginSchema, req.body);
        if (error || !value) {
            return res.status(400).json({
                success: false,
                error: {
                    code: errors_1.ErrorCode.VALIDATION_ERROR,
                    message: error || 'Invalid request data',
                    timestamp: new Date(),
                },
                timestamp: new Date(),
            });
        }
        // Authenticate user
        const result = await authService.login(value);
        // Return success response
        const response = {
            success: true,
            data: {
                user: {
                    userId: result.user.userId,
                    email: result.user.email,
                    fullName: result.user.fullName,
                },
                tokens: result.tokens,
            },
            timestamp: new Date(),
        };
        res.status(200).json(response);
    }
    catch (error) {
        return handleError(error, res, next);
    }
});
// POST /api/auth/register
router.post('/register', (0, auth_2.authRateLimit)(3, 15), async (req, res, next) => {
    try {
        // Validate request body
        const { error, value } = (0, schemas_1.validateRequest)(schemas_2.registerSchema, req.body);
        if (error || !value) {
            return res.status(400).json({
                success: false,
                error: {
                    code: errors_1.ErrorCode.VALIDATION_ERROR,
                    message: error || 'Invalid request data',
                    timestamp: new Date(),
                },
                timestamp: new Date(),
            });
        }
        // Register user
        const result = await authService.register(value);
        // Return success response
        const response = {
            success: true,
            data: {
                user: {
                    userId: result.user.userId,
                    email: result.user.email,
                    fullName: result.user.fullName,
                },
                tokens: result.tokens,
            },
            timestamp: new Date(),
        };
        res.status(201).json(response);
    }
    catch (error) {
        return handleError(error, res, next);
    }
});
// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
    try {
        // Validate request body
        const { error, value } = (0, schemas_1.validateRequest)(schemas_2.refreshTokenSchema, req.body);
        if (error || !value) {
            return res.status(400).json({
                success: false,
                error: {
                    code: errors_1.ErrorCode.VALIDATION_ERROR,
                    message: error || 'Invalid request data',
                    timestamp: new Date(),
                },
                timestamp: new Date(),
            });
        }
        // Refresh token
        const result = await authService.refreshToken(value.refreshToken);
        // Return success response
        const response = {
            success: true,
            data: result,
            timestamp: new Date(),
        };
        res.status(200).json(response);
    }
    catch (error) {
        return handleError(error, res, next);
    }
});
// GET /api/auth/profile
router.get('/profile', auth_2.authenticateToken, async (req, res, next) => {
    try {
        // Get user ID from authenticated request (set by auth middleware)
        const userId = req.user.userId;
        // Get user profile
        const userProfile = await authService.getUserProfile(userId);
        // Return success response
        const response = {
            success: true,
            data: userProfile,
            timestamp: new Date(),
        };
        res.status(200).json(response);
    }
    catch (error) {
        return handleError(error, res, next);
    }
});
// PUT /api/auth/profile
router.put('/profile', auth_2.authenticateToken, async (req, res, next) => {
    try {
        // Get user ID from authenticated request (set by auth middleware)
        const userId = req.user.userId;
        // Validate request body
        const { error, value } = (0, schemas_1.validateRequest)(schemas_2.updateProfileSchema, req.body);
        if (error || !value) {
            return res.status(400).json({
                success: false,
                error: {
                    code: errors_1.ErrorCode.VALIDATION_ERROR,
                    message: error || 'Invalid request data',
                    timestamp: new Date(),
                },
                timestamp: new Date(),
            });
        }
        // Update user profile
        const updatedProfile = await authService.updateUserProfile(userId, value);
        // Return success response
        const response = {
            success: true,
            data: updatedProfile,
            timestamp: new Date(),
        };
        res.status(200).json(response);
    }
    catch (error) {
        return handleError(error, res, next);
    }
});
// GET /api/auth/google - Initiate Google OAuth flow
router.get('/google', async (req, res, next) => {
    try {
        if (!googleOAuthService) {
            return res.status(503).json({
                success: false,
                error: {
                    code: errors_1.ErrorCode.SERVICE_UNAVAILABLE,
                    message: 'Google OAuth is not configured',
                    timestamp: new Date(),
                },
                timestamp: new Date(),
            });
        }
        // Generate state parameter for CSRF protection
        const state = Math.random().toString(36).substring(2, 15);
        // Store state in session or return it to client to verify later
        // For now, we'll include it in the URL
        const authUrl = await googleOAuthService.generateAuthUrl(state);
        // Return the authorization URL
        const response = {
            success: true,
            data: {
                authUrl,
                state,
            },
            timestamp: new Date(),
        };
        res.status(200).json(response);
    }
    catch (error) {
        return handleError(error, res, next);
    }
});
// GET /api/auth/google/callback - Handle Google OAuth callback
router.get('/google/callback', async (req, res, next) => {
    try {
        if (!googleOAuthService) {
            return res.status(503).json({
                success: false,
                error: {
                    code: errors_1.ErrorCode.SERVICE_UNAVAILABLE,
                    message: 'Google OAuth is not configured',
                    timestamp: new Date(),
                },
                timestamp: new Date(),
            });
        }
        const { code, state, error: oauthError } = req.query;
        // Check for OAuth errors
        if (oauthError) {
            return res.status(400).json({
                success: false,
                error: {
                    code: errors_1.ErrorCode.INVALID_CREDENTIALS,
                    message: `OAuth error: ${oauthError}`,
                    timestamp: new Date(),
                },
                timestamp: new Date(),
            });
        }
        // Validate required parameters
        if (!code || typeof code !== 'string') {
            return res.status(400).json({
                success: false,
                error: {
                    code: errors_1.ErrorCode.VALIDATION_ERROR,
                    message: 'Authorization code is required',
                    timestamp: new Date(),
                },
                timestamp: new Date(),
            });
        }
        // Exchange code for user info
        const googleUserData = await googleOAuthService.handleCallback(code);
        // Create or update user account
        const result = await authService.handleGoogleOAuth(googleUserData);
        // Return success response
        const response = {
            success: true,
            data: {
                user: {
                    userId: result.user.userId,
                    email: result.user.email,
                    fullName: result.user.fullName,
                },
                tokens: result.tokens,
                isNewUser: result.isNewUser,
            },
            timestamp: new Date(),
        };
        res.status(200).json(response);
    }
    catch (error) {
        return handleError(error, res, next);
    }
});
// POST /api/auth/google/token - Handle Google ID token authentication (for client-side)
router.post('/google/token', async (req, res, next) => {
    try {
        if (!googleOAuthService) {
            return res.status(503).json({
                success: false,
                error: {
                    code: errors_1.ErrorCode.SERVICE_UNAVAILABLE,
                    message: 'Google OAuth is not configured',
                    timestamp: new Date(),
                },
                timestamp: new Date(),
            });
        }
        // Validate request body
        const { idToken } = req.body;
        if (!idToken || typeof idToken !== 'string') {
            return res.status(400).json({
                success: false,
                error: {
                    code: errors_1.ErrorCode.VALIDATION_ERROR,
                    message: 'Google ID token is required',
                    timestamp: new Date(),
                },
                timestamp: new Date(),
            });
        }
        // Verify ID token and get user info
        const googleUserData = await googleOAuthService.verifyIdToken(idToken);
        // Create or update user account
        const result = await authService.handleGoogleOAuth(googleUserData);
        // Return success response
        const response = {
            success: true,
            data: {
                user: {
                    userId: result.user.userId,
                    email: result.user.email,
                    fullName: result.user.fullName,
                },
                tokens: result.tokens,
                isNewUser: result.isNewUser,
            },
            timestamp: new Date(),
        };
        res.status(200).json(response);
    }
    catch (error) {
        return handleError(error, res, next);
    }
});
