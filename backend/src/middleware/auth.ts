import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth';
import { ErrorCode, formatErrorResponse, createError } from 'asap-cv-shared/src/types/errors';
import { ApiResponse } from 'asap-cv-shared/src/types/api';

// Extend Express Request interface to include user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

const authService = new AuthService();

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      const error = createError(ErrorCode.UNAUTHORIZED, 'Access token is required');
      return res.status(401).json(formatErrorResponse(error)) as any;
    }

    // Verify token
    const decoded = await authService.verifyAccessToken(token);

    // Verify user still exists
    const user = await authService.findUserById(decoded.userId);
    if (!user) {
      const error = createError(ErrorCode.USER_NOT_FOUND, 'User account not found');
      return res.status(404).json(formatErrorResponse(error)) as any;
    }

    // Add user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error: any) {
    if (error.code) {
      const statusCode = error.code === ErrorCode.TOKEN_EXPIRED ? 401 : 401;
      return res.status(statusCode).json(formatErrorResponse(error)) as any;
    }

    const authError = createError(ErrorCode.TOKEN_INVALID, 'Invalid access token');
    return res.status(401).json(formatErrorResponse(authError)) as any;
  }
};

/**
 * Middleware to optionally authenticate JWT tokens (doesn't fail if no token)
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      // No token provided, continue without authentication
      return next();
    }

    // Verify token
    const decoded = await authService.verifyAccessToken(token);

    // Verify user still exists
    const user = await authService.findUserById(decoded.userId);
    if (user) {
      // Add user info to request if user exists
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
      };
    }

    next();
  } catch (error) {
    // For optional auth, we don't fail on token errors
    // Just continue without setting user
    next();
  }
};

/**
 * Middleware to check if user owns a resource
 */
export const requireResourceOwnership = (resourceUserIdField: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        const error = createError(ErrorCode.UNAUTHORIZED, 'Authentication required');
        return res.status(401).json(formatErrorResponse(error)) as any;
      }

      // Get resource user ID from request params, body, or query
      const resourceUserId = req.params[resourceUserIdField] || 
                           req.body[resourceUserIdField] || 
                           req.query[resourceUserIdField];

      if (!resourceUserId) {
        const error = createError(ErrorCode.VALIDATION_ERROR, `${resourceUserIdField} is required`);
        return res.status(400).json(formatErrorResponse(error)) as any;
      }

      // Check if authenticated user owns the resource
      if (req.user.userId !== resourceUserId) {
        const error = createError(ErrorCode.FORBIDDEN, 'Access denied: insufficient permissions');
        return res.status(403).json(formatErrorResponse(error)) as any;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to validate user data isolation
 * Ensures that any userId in the request matches the authenticated user
 */
export const validateUserDataIsolation = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.user) {
      const error = createError(ErrorCode.UNAUTHORIZED, 'Authentication required');
      return res.status(401).json(formatErrorResponse(error)) as any;
    }

    // Check for userId in various parts of the request
    const userIdSources = [
      req.params.userId,
      req.body.userId,
      req.query.userId,
      req.params.id, // Sometimes the user ID is in the 'id' parameter
    ].filter(Boolean);

    // If any userId is present, it must match the authenticated user
    for (const userId of userIdSources) {
      if (userId && userId !== req.user.userId) {
        const error = createError(
          ErrorCode.FORBIDDEN, 
          'Access denied: cannot access other users\' data'
        );
        return res.status(403).json(formatErrorResponse(error)) as any;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to add security headers
 */
export const securityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Add HSTS header for HTTPS
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
};

/**
 * Rate limiting middleware for authentication endpoints
 */
export const authRateLimit = (
  maxAttempts: number = 5,
  windowMinutes: number = 15
) => {
  const attempts = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;

    // Get or create attempt record
    let attemptRecord = attempts.get(clientId);
    
    if (!attemptRecord || now > attemptRecord.resetTime) {
      // Reset or create new record
      attemptRecord = {
        count: 0,
        resetTime: now + windowMs,
      };
      attempts.set(clientId, attemptRecord);
    }

    // Check if limit exceeded
    if (attemptRecord.count >= maxAttempts) {
      const retryAfter = Math.ceil((attemptRecord.resetTime - now) / 1000);
      const error = createError(
        ErrorCode.TOO_MANY_REQUESTS,
        `Too many authentication attempts. Try again in ${Math.ceil(retryAfter / 60)} minutes.`
      );
      
      res.setHeader('Retry-After', retryAfter.toString());
      return res.status(429).json(formatErrorResponse(error)) as any;
    }

    // Increment attempt count
    attemptRecord.count++;

    // Add rate limit info to response headers
    res.setHeader('X-RateLimit-Limit', maxAttempts.toString());
    res.setHeader('X-RateLimit-Remaining', (maxAttempts - attemptRecord.count).toString());
    res.setHeader('X-RateLimit-Reset', attemptRecord.resetTime.toString());

    next();
  };
};

/**
 * Session management utilities
 */
export class SessionManager {
  private static activeSessions = new Map<string, {
    userId: string;
    email: string;
    createdAt: number;
    lastActivity: number;
  }>();

  /**
   * Create a session record
   */
  public static createSession(userId: string, email: string, sessionId?: string): string {
    const id = sessionId || this.generateSessionId();
    const now = Date.now();

    this.activeSessions.set(id, {
      userId,
      email,
      createdAt: now,
      lastActivity: now,
    });

    return id;
  }

  /**
   * Update session activity
   */
  public static updateActivity(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.lastActivity = Date.now();
      return true;
    }
    return false;
  }

  /**
   * Invalidate a session
   */
  public static invalidateSession(sessionId: string): boolean {
    return this.activeSessions.delete(sessionId);
  }

  /**
   * Invalidate all sessions for a user
   */
  public static invalidateUserSessions(userId: string): number {
    let count = 0;
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.userId === userId) {
        this.activeSessions.delete(sessionId);
        count++;
      }
    }
    return count;
  }

  /**
   * Clean up expired sessions
   */
  public static cleanupExpiredSessions(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    let count = 0;

    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now - session.lastActivity > maxAgeMs) {
        this.activeSessions.delete(sessionId);
        count++;
      }
    }

    return count;
  }

  /**
   * Get session info
   */
  public static getSession(sessionId: string) {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Generate a secure session ID
   */
  private static generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) +
           Date.now().toString(36);
  }

  /**
   * Get active session count for user
   */
  public static getUserSessionCount(userId: string): number {
    let count = 0;
    for (const session of this.activeSessions.values()) {
      if (session.userId === userId) {
        count++;
      }
    }
    return count;
  }
}

// Cleanup expired sessions every hour
setInterval(() => {
  const cleaned = SessionManager.cleanupExpiredSessions();
  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} expired sessions`);
  }
}, 60 * 60 * 1000);