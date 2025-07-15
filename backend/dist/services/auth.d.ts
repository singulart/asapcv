import { User, AuthTokens, UserProfile } from '../../../shared/src/types/user';
import { LoginRequest, RegisterRequest } from '../../../shared/src/types/api';
export declare class AuthService {
    /**
     * Hash password using bcrypt
     */
    private hashPassword;
    /**
     * Verify password against hash
     */
    private verifyPassword;
    /**
     * Generate JWT tokens
     */
    private generateTokens;
    /**
     * Parse expiration time string to seconds
     */
    private parseExpirationTime;
    /**
     * Verify JWT token
     */
    verifyAccessToken(token: string): {
        userId: string;
        email: string;
    };
    /**
     * Verify refresh token
     */
    verifyRefreshToken(token: string): {
        userId: string;
        email: string;
    };
    /**
     * Find user by email
     */
    private findUserByEmail;
    /**
     * Find user by ID
     */
    findUserById(userId: string): Promise<User | null>;
    /**
     * Create new user
     */
    private createUser;
    /**
     * Register new user with email/password
     */
    register(registerData: RegisterRequest): Promise<{
        user: UserProfile;
        tokens: AuthTokens;
    }>;
    /**
     * Login user with email/password
     */
    login(loginData: LoginRequest): Promise<{
        user: UserProfile;
        tokens: AuthTokens;
    }>;
    /**
     * Refresh access token
     */
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        expiresIn: number;
    }>;
    /**
     * Get user profile
     */
    getUserProfile(userId: string): Promise<UserProfile>;
    /**
     * Update user profile
     */
    updateUserProfile(userId: string, updates: {
        fullName?: string;
        email?: string;
    }): Promise<UserProfile>;
    /**
     * Create or update user from Google OAuth
     */
    handleGoogleOAuth(googleUserData: {
        googleId: string;
        email: string;
        fullName: string;
    }): Promise<{
        user: UserProfile;
        tokens: AuthTokens;
        isNewUser: boolean;
    }>;
}
