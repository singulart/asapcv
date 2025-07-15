"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleOAuthService = void 0;
const google_auth_library_1 = require("google-auth-library");
const errors_1 = require("asap-cv-shared/dist/types/errors");
const secretsManager_1 = require("./secretsManager");
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';
class GoogleOAuthService {
    constructor() {
        this.oauth2Client = null;
        this.credentials = null;
        // OAuth2Client will be initialized lazily when credentials are loaded
    }
    /**
     * Initialize OAuth2Client with credentials from secrets manager
     */
    async initializeClient() {
        if (this.oauth2Client && this.credentials) {
            return; // Already initialized
        }
        this.credentials = await secretsManager_1.secretsManager.getGoogleOAuthCredentials();
        if (!this.credentials) {
            throw (0, errors_1.createError)(errors_1.ErrorCode.SERVICE_UNAVAILABLE, 'Google OAuth is not configured. Please configure Google OAuth secrets.');
        }
        this.oauth2Client = new google_auth_library_1.OAuth2Client(this.credentials.clientId, this.credentials.clientSecret, GOOGLE_REDIRECT_URI);
    }
    /**
     * Generate Google OAuth authorization URL
     */
    async generateAuthUrl(state) {
        await this.initializeClient();
        const scopes = [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
        ];
        const authUrl = this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            include_granted_scopes: true,
            state: state || '',
            prompt: 'consent', // Force consent screen to ensure we get refresh token
        });
        return authUrl;
    }
    /**
     * Exchange authorization code for tokens and user info
     */
    async handleCallback(code) {
        try {
            await this.initializeClient();
            // Exchange code for tokens
            const { tokens } = await this.oauth2Client.getToken(code);
            if (!tokens.access_token) {
                throw (0, errors_1.createError)(errors_1.ErrorCode.INVALID_CREDENTIALS, 'Failed to obtain access token from Google');
            }
            // Set credentials
            this.oauth2Client.setCredentials(tokens);
            // Get user info
            const userInfo = await this.getUserInfo(tokens.access_token);
            return userInfo;
        }
        catch (error) {
            console.error('Google OAuth callback error:', error);
            if (error.code) {
                throw error; // Re-throw our custom errors
            }
            throw (0, errors_1.createError)(errors_1.ErrorCode.INVALID_CREDENTIALS, 'Failed to authenticate with Google. Please try again.');
        }
    }
    /**
     * Get user information from Google
     */
    async getUserInfo(accessToken) {
        try {
            // Use the access token to get user info
            const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (!response.ok) {
                throw new Error(`Google API error: ${response.status}`);
            }
            const userInfo = await response.json();
            // Validate required fields
            if (!userInfo.id || !userInfo.email || !userInfo.name) {
                throw (0, errors_1.createError)(errors_1.ErrorCode.INVALID_CREDENTIALS, 'Incomplete user information received from Google');
            }
            return {
                googleId: userInfo.id,
                email: userInfo.email,
                fullName: userInfo.name,
                verified: userInfo.verified_email || false,
            };
        }
        catch (error) {
            console.error('Error fetching Google user info:', error);
            if (error.code) {
                throw error; // Re-throw our custom errors
            }
            throw (0, errors_1.createError)(errors_1.ErrorCode.AI_SERVICE_ERROR, 'Failed to retrieve user information from Google');
        }
    }
    /**
     * Verify Google ID token (for client-side authentication)
     */
    async verifyIdToken(idToken) {
        try {
            await this.initializeClient();
            const ticket = await this.oauth2Client.verifyIdToken({
                idToken,
                audience: this.credentials.clientId,
            });
            const payload = ticket.getPayload();
            if (!payload || !payload.sub || !payload.email || !payload.name) {
                throw (0, errors_1.createError)(errors_1.ErrorCode.INVALID_CREDENTIALS, 'Invalid Google ID token payload');
            }
            return {
                googleId: payload.sub,
                email: payload.email,
                fullName: payload.name,
                verified: payload.email_verified || false,
            };
        }
        catch (error) {
            console.error('Google ID token verification error:', error);
            if (error.code) {
                throw error; // Re-throw our custom errors
            }
            throw (0, errors_1.createError)(errors_1.ErrorCode.TOKEN_INVALID, 'Invalid Google ID token');
        }
    }
    /**
     * Check if Google OAuth is configured
     */
    static isConfigured() {
        const googleClientId = process.env.GOOGLE_CLIENT_ID;
        const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
        return !!(googleClientId && googleClientSecret);
    }
    /**
     * Check if Google OAuth is configured (instance method)
     */
    async isConfigured() {
        try {
            const credentials = await secretsManager_1.secretsManager.getGoogleOAuthCredentials();
            return !!credentials;
        }
        catch (error) {
            return false;
        }
    }
}
exports.GoogleOAuthService = GoogleOAuthService;
