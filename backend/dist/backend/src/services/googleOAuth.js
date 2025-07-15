"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleOAuthService = void 0;
const google_auth_library_1 = require("google-auth-library");
const errors_1 = require("@shared/types/errors");
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn('Google OAuth credentials not configured. OAuth functionality will be disabled.');
}
class GoogleOAuthService {
    constructor() {
        if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
            throw (0, errors_1.createError)(errors_1.ErrorCode.SERVICE_UNAVAILABLE, 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
        }
        this.oauth2Client = new google_auth_library_1.OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
    }
    /**
     * Generate Google OAuth authorization URL
     */
    generateAuthUrl(state) {
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
            const ticket = await this.oauth2Client.verifyIdToken({
                idToken,
                audience: GOOGLE_CLIENT_ID,
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
        return !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
    }
}
exports.GoogleOAuthService = GoogleOAuthService;
