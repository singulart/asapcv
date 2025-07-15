export declare class GoogleOAuthService {
    private oauth2Client;
    private credentials;
    constructor();
    /**
     * Initialize OAuth2Client with credentials from secrets manager
     */
    private initializeClient;
    /**
     * Generate Google OAuth authorization URL
     */
    generateAuthUrl(state?: string): Promise<string>;
    /**
     * Exchange authorization code for tokens and user info
     */
    handleCallback(code: string): Promise<{
        googleId: string;
        email: string;
        fullName: string;
        verified: boolean;
    }>;
    /**
     * Get user information from Google
     */
    private getUserInfo;
    /**
     * Verify Google ID token (for client-side authentication)
     */
    verifyIdToken(idToken: string): Promise<{
        googleId: string;
        email: string;
        fullName: string;
        verified: boolean;
    }>;
    /**
     * Check if Google OAuth is configured
     */
    static isConfigured(): boolean;
    /**
     * Check if Google OAuth is configured (instance method)
     */
    isConfigured(): Promise<boolean>;
}
