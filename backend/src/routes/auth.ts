import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth';
import { GoogleOAuthService } from '../services/googleOAuth';
import { authenticateToken, authRateLimit, securityHeaders } from '../middleware/auth';
import { validateRequest } from 'asap-cv-shared';
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  updateProfileSchema,
  googleOAuthSchema
} from 'asap-cv-shared';
import {
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  UpdateProfileRequest,
  GoogleOAuthRequest,
  ApiResponse,
  LoginResponse,
  RegisterResponse,
  RefreshTokenResponse,
  ProfileResponse
} from 'asap-cv-shared';
import { AppError, ErrorCode, ErrorHttpStatusMap, formatErrorResponse } from 'asap-cv-shared';

// Helper function to handle errors consistently
const handleError = (error: any, res: Response, next: NextFunction) => {
  if (error && typeof error === 'object' && 'code' in error && Object.values(ErrorCode).includes(error.code)) {
    const statusCode = ErrorHttpStatusMap[error.code as ErrorCode] || 500;
    return res.status(statusCode).json(formatErrorResponse(error));
  }
  next(error);
};

const router = Router();
const authService = new AuthService();

// Initialize Google OAuth service if configured
let googleOAuthService: GoogleOAuthService | null = null;
try {
  if (GoogleOAuthService.isConfigured()) {
    googleOAuthService = new GoogleOAuthService();
  }
} catch (error) {
  console.warn('Google OAuth service initialization failed:', error);
}

// Apply security headers to all routes
router.use(securityHeaders);

// POST /api/auth/login
router.post('/login', authRateLimit(5, 15), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const { error, value } = validateRequest<LoginRequest>(loginSchema, req.body);
    if (error || !value) {
      return res.status(400).json({
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: error || 'Invalid request data',
          timestamp: new Date(),
        },
        timestamp: new Date(),
      } as ApiResponse);
    }

    // Authenticate user
    const result = await authService.login(value);

    // Return success response
    const response: ApiResponse<LoginResponse> = {
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
  } catch (error: any) {
    return handleError(error, res, next);
  }
});

// POST /api/auth/register
router.post('/register', authRateLimit(3, 15), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const { error, value } = validateRequest<RegisterRequest>(registerSchema, req.body);
    if (error || !value) {
      return res.status(400).json({
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: error || 'Invalid request data',
          timestamp: new Date(),
        },
        timestamp: new Date(),
      } as ApiResponse);
    }

    // Register user
    const result = await authService.register(value);

    // Return success response
    const response: ApiResponse<RegisterResponse> = {
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
  } catch (error: any) {
    return handleError(error, res, next);
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const { error, value } = validateRequest<RefreshTokenRequest>(refreshTokenSchema, req.body);
    if (error || !value) {
      return res.status(400).json({
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: error || 'Invalid request data',
          timestamp: new Date(),
        },
        timestamp: new Date(),
      } as ApiResponse);
    }

    // Refresh token
    const result = await authService.refreshToken(value.refreshToken);

    // Return success response
    const response: ApiResponse<RefreshTokenResponse> = {
      success: true,
      data: result,
      timestamp: new Date(),
    };

    res.status(200).json(response);
  } catch (error: any) {
    return handleError(error, res, next);
  }
});

// GET /api/auth/profile
router.get('/profile', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get user ID from authenticated request (set by auth middleware)
    const userId = req.user!.userId;

    // Get user profile
    const userProfile = await authService.getUserProfile(userId);

    // Return success response
    const response: ApiResponse<ProfileResponse> = {
      success: true,
      data: userProfile,
      timestamp: new Date(),
    };

    res.status(200).json(response);
  } catch (error: any) {
    return handleError(error, res, next);
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get user ID from authenticated request (set by auth middleware)
    const userId = req.user!.userId;

    // Validate request body
    const { error, value } = validateRequest<UpdateProfileRequest>(updateProfileSchema, req.body);
    if (error || !value) {
      return res.status(400).json({
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: error || 'Invalid request data',
          timestamp: new Date(),
        },
        timestamp: new Date(),
      } as ApiResponse);
    }

    // Update user profile
    const updatedProfile = await authService.updateUserProfile(userId, value);

    // Return success response
    const response: ApiResponse<ProfileResponse> = {
      success: true,
      data: updatedProfile,
      timestamp: new Date(),
    };

    res.status(200).json(response);
  } catch (error: any) {
    return handleError(error, res, next);
  }
});

// GET /api/auth/google - Initiate Google OAuth flow
router.get('/google', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!googleOAuthService) {
      return res.status(503).json({
        success: false,
        error: {
          code: ErrorCode.SERVICE_UNAVAILABLE,
          message: 'Google OAuth is not configured',
          timestamp: new Date(),
        },
        timestamp: new Date(),
      } as ApiResponse);
    }

    // Generate state parameter for CSRF protection
    const state = Math.random().toString(36).substring(2, 15);

    // Generate Google OAuth URL
    const authUrl = await googleOAuthService.generateAuthUrl(state);

    // Redirect to Google OAuth authorization URL
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.redirect(authUrl);
  } catch (error: any) {
    return handleError(error, res, next);
  }
});

// GET /api/auth/google/callback - Handle Google OAuth callback
router.get('/google/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!googleOAuthService) {
      return res.status(503).json({
        success: false,
        error: {
          code: ErrorCode.SERVICE_UNAVAILABLE,
          message: 'Google OAuth is not configured',
          timestamp: new Date(),
        },
        timestamp: new Date(),
      } as ApiResponse);
    }

    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      return res.status(400).json({
        success: false,
        error: {
          code: ErrorCode.INVALID_CREDENTIALS,
          message: `OAuth error: ${oauthError}`,
          timestamp: new Date(),
        },
        timestamp: new Date(),
      } as ApiResponse);
    }

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Authorization code is required',
          timestamp: new Date(),
        },
        timestamp: new Date(),
      } as ApiResponse);
    }

    // Exchange code for user info
    const googleUserData = await googleOAuthService.handleCallback(code);

    // Create or update user account
    const result = await authService.handleGoogleOAuth(googleUserData);

    // Set JWT token cookie (adjust options as needed)
    res.cookie('jwt', result.tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // or 'strict'/'none' depending on your needs
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Redirect to dashboard on success
    return res.redirect('/oauth');
  } catch (error: any) {
    return handleError(error, res, next);
  }
});


// POST /api/auth/google/token - Handle Google ID token authentication (for client-side)
router.post('/google/token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!googleOAuthService) {
      return res.status(503).json({
        success: false,
        error: {
          code: ErrorCode.SERVICE_UNAVAILABLE,
          message: 'Google OAuth is not configured',
          timestamp: new Date(),
        },
        timestamp: new Date(),
      } as ApiResponse);
    }

    // Validate request body
    const { idToken } = req.body;
    if (!idToken || typeof idToken !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Google ID token is required',
          timestamp: new Date(),
        },
        timestamp: new Date(),
      } as ApiResponse);
    }

    // Verify ID token and get user info
    const googleUserData = await googleOAuthService.verifyIdToken(idToken);

    // Create or update user account
    const result = await authService.handleGoogleOAuth(googleUserData);

    // Return success response
    const response: ApiResponse<LoginResponse & { isNewUser: boolean }> = {
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
  } catch (error: any) {
    return handleError(error, res, next);
  }
});

export { router as authRoutes };