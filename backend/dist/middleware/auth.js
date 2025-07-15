"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionManager = exports.authRateLimit = exports.securityHeaders = exports.validateUserDataIsolation = exports.requireResourceOwnership = exports.optionalAuth = exports.authenticateToken = void 0;
const auth_1 = require("../services/auth");
const errors_1 = require("../../../shared/src/types/errors");
const authService = new auth_1.AuthService();
/**
 * Middleware to authenticate JWT tokens
 */
const authenticateToken = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : null;
        if (!token) {
            const error = (0, errors_1.createError)(errors_1.ErrorCode.UNAUTHORIZED, 'Access token is required');
            return res.status(401).json((0, errors_1.formatErrorResponse)(error));
        }
        // Verify token
        const decoded = authService.verifyAccessToken(token);
        // Verify user still exists
        const user = await authService.findUserById(decoded.userId);
        if (!user) {
            const error = (0, errors_1.createError)(errors_1.ErrorCode.USER_NOT_FOUND, 'User account not found');
            return res.status(404).json((0, errors_1.formatErrorResponse)(error));
        }
        // Add user info to request
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
        };
        next();
    }
    catch (error) {
        if (error.code) {
            const statusCode = error.code === errors_1.ErrorCode.TOKEN_EXPIRED ? 401 : 401;
            return res.status(statusCode).json((0, errors_1.formatErrorResponse)(error));
        }
        const authError = (0, errors_1.createError)(errors_1.ErrorCode.TOKEN_INVALID, 'Invalid access token');
        return res.status(401).json((0, errors_1.formatErrorResponse)(authError));
    }
};
exports.authenticateToken = authenticateToken;
/**
 * Middleware to optionally authenticate JWT tokens (doesn't fail if no token)
 */
const optionalAuth = async (req, res, next) => {
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
        const decoded = authService.verifyAccessToken(token);
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
    }
    catch (error) {
        // For optional auth, we don't fail on token errors
        // Just continue without setting user
        next();
    }
};
exports.optionalAuth = optionalAuth;
/**
 * Middleware to check if user owns a resource
 */
const requireResourceOwnership = (resourceUserIdField = 'userId') => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                const error = (0, errors_1.createError)(errors_1.ErrorCode.UNAUTHORIZED, 'Authentication required');
                return res.status(401).json((0, errors_1.formatErrorResponse)(error));
            }
            // Get resource user ID from request params, body, or query
            const resourceUserId = req.params[resourceUserIdField] ||
                req.body[resourceUserIdField] ||
                req.query[resourceUserIdField];
            if (!resourceUserId) {
                const error = (0, errors_1.createError)(errors_1.ErrorCode.VALIDATION_ERROR, `${resourceUserIdField} is required`);
                return res.status(400).json((0, errors_1.formatErrorResponse)(error));
            }
            // Check if authenticated user owns the resource
            if (req.user.userId !== resourceUserId) {
                const error = (0, errors_1.createError)(errors_1.ErrorCode.FORBIDDEN, 'Access denied: insufficient permissions');
                return res.status(403).json((0, errors_1.formatErrorResponse)(error));
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requireResourceOwnership = requireResourceOwnership;
/**
 * Middleware to validate user data isolation
 * Ensures that any userId in the request matches the authenticated user
 */
const validateUserDataIsolation = (req, res, next) => {
    try {
        if (!req.user) {
            const error = (0, errors_1.createError)(errors_1.ErrorCode.UNAUTHORIZED, 'Authentication required');
            return res.status(401).json((0, errors_1.formatErrorResponse)(error));
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
                const error = (0, errors_1.createError)(errors_1.ErrorCode.FORBIDDEN, 'Access denied: cannot access other users\' data');
                return res.status(403).json((0, errors_1.formatErrorResponse)(error));
            }
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.validateUserDataIsolation = validateUserDataIsolation;
/**
 * Middleware to add security headers
 */
const securityHeaders = (req, res, next) => {
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
exports.securityHeaders = securityHeaders;
/**
 * Rate limiting middleware for authentication endpoints
 */
const authRateLimit = (maxAttempts = 5, windowMinutes = 15) => {
    const attempts = new Map();
    return (req, res, next) => {
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
            const error = (0, errors_1.createError)(errors_1.ErrorCode.TOO_MANY_REQUESTS, `Too many authentication attempts. Try again in ${Math.ceil(retryAfter / 60)} minutes.`);
            res.setHeader('Retry-After', retryAfter.toString());
            return res.status(429).json((0, errors_1.formatErrorResponse)(error));
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
exports.authRateLimit = authRateLimit;
/**
 * Session management utilities
 */
class SessionManager {
    /**
     * Create a session record
     */
    static createSession(userId, email, sessionId) {
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
    static updateActivity(sessionId) {
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
    static invalidateSession(sessionId) {
        return this.activeSessions.delete(sessionId);
    }
    /**
     * Invalidate all sessions for a user
     */
    static invalidateUserSessions(userId) {
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
    static cleanupExpiredSessions(maxAgeMs = 24 * 60 * 60 * 1000) {
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
    static getSession(sessionId) {
        return this.activeSessions.get(sessionId);
    }
    /**
     * Generate a secure session ID
     */
    static generateSessionId() {
        return Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15) +
            Date.now().toString(36);
    }
    /**
     * Get active session count for user
     */
    static getUserSessionCount(userId) {
        let count = 0;
        for (const session of this.activeSessions.values()) {
            if (session.userId === userId) {
                count++;
            }
        }
        return count;
    }
}
exports.SessionManager = SessionManager;
SessionManager.activeSessions = new Map();
// Cleanup expired sessions every hour
setInterval(() => {
    const cleaned = SessionManager.cleanupExpiredSessions();
    if (cleaned > 0) {
        console.log(`Cleaned up ${cleaned} expired sessions`);
    }
}, 60 * 60 * 1000);
