import { Request, Response, NextFunction } from 'express';
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
/**
 * Middleware to authenticate JWT tokens
 */
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to optionally authenticate JWT tokens (doesn't fail if no token)
 */
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to check if user owns a resource
 */
export declare const requireResourceOwnership: (resourceUserIdField?: string) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to validate user data isolation
 * Ensures that any userId in the request matches the authenticated user
 */
export declare const validateUserDataIsolation: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to add security headers
 */
export declare const securityHeaders: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Rate limiting middleware for authentication endpoints
 */
export declare const authRateLimit: (maxAttempts?: number, windowMinutes?: number) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Session management utilities
 */
export declare class SessionManager {
    private static activeSessions;
    /**
     * Create a session record
     */
    static createSession(userId: string, email: string, sessionId?: string): string;
    /**
     * Update session activity
     */
    static updateActivity(sessionId: string): boolean;
    /**
     * Invalidate a session
     */
    static invalidateSession(sessionId: string): boolean;
    /**
     * Invalidate all sessions for a user
     */
    static invalidateUserSessions(userId: string): number;
    /**
     * Clean up expired sessions
     */
    static cleanupExpiredSessions(maxAgeMs?: number): number;
    /**
     * Get session info
     */
    static getSession(sessionId: string): {
        userId: string;
        email: string;
        createdAt: number;
        lastActivity: number;
    } | undefined;
    /**
     * Generate a secure session ID
     */
    private static generateSessionId;
    /**
     * Get active session count for user
     */
    static getUserSessionCount(userId: string): number;
}
