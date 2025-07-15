import { OAuth2Client } from 'google-auth-library';
import { ErrorCode, createError } from 'asap-cv-shared/dist/types/errors';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn('Google OAuth credentials not configured. OAuth functionality will be disabled.');
}

export class GoogleOAuthService {
  private oauth2Client: OAuth2Client;

  constructor() {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      throw createError(
        ErrorCode.SERVICE_UNAVAILABLE,
        'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.'
      );
    }

    this.oauth2Client = new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );
  }

  /**
   * Generate Google OAuth authorization URL
   */
  public generateAuthUrl(state?: string): string {
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
  public async handleCallback(code: string): Promise<{
    googleId: string;
    email: string;
    fullName: string;
    verified: boolean;
  }> {
    try {
      // Exchange code for tokens
      const { tokens } = await this.oauth2Client.getToken(code);
      
      if (!tokens.access_token) {
        throw createError(ErrorCode.INVALID_CREDENTIALS, 'Failed to obtain access token from Google');
      }

      // Set credentials
      this.oauth2Client.setCredentials(tokens);

      // Get user info
      const userInfo = await this.getUserInfo(tokens.access_token);

      return userInfo;
    } catch (error: any) {
      console.error('Google OAuth callback error:', error);
      
      if (error.code) {
        throw error; // Re-throw our custom errors
      }
      
      throw createError(
        ErrorCode.INVALID_CREDENTIALS,
        'Failed to authenticate with Google. Please try again.'
      );
    }
  }

  /**
   * Get user information from Google
   */
  private async getUserInfo(accessToken: string): Promise<{
    googleId: string;
    email: string;
    fullName: string;
    verified: boolean;
  }> {
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

      const userInfo = await response.json() as any;

      // Validate required fields
      if (!userInfo.id || !userInfo.email || !userInfo.name) {
        throw createError(
          ErrorCode.INVALID_CREDENTIALS,
          'Incomplete user information received from Google'
        );
      }

      return {
        googleId: userInfo.id,
        email: userInfo.email,
        fullName: userInfo.name,
        verified: userInfo.verified_email || false,
      };
    } catch (error: any) {
      console.error('Error fetching Google user info:', error);
      
      if (error.code) {
        throw error; // Re-throw our custom errors
      }
      
      throw createError(
        ErrorCode.AI_SERVICE_ERROR,
        'Failed to retrieve user information from Google'
      );
    }
  }

  /**
   * Verify Google ID token (for client-side authentication)
   */
  public async verifyIdToken(idToken: string): Promise<{
    googleId: string;
    email: string;
    fullName: string;
    verified: boolean;
  }> {
    try {
      const ticket = await this.oauth2Client.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      
      if (!payload || !payload.sub || !payload.email || !payload.name) {
        throw createError(
          ErrorCode.INVALID_CREDENTIALS,
          'Invalid Google ID token payload'
        );
      }

      return {
        googleId: payload.sub,
        email: payload.email,
        fullName: payload.name,
        verified: payload.email_verified || false,
      };
    } catch (error: any) {
      console.error('Google ID token verification error:', error);
      
      if (error.code) {
        throw error; // Re-throw our custom errors
      }
      
      throw createError(
        ErrorCode.TOKEN_INVALID,
        'Invalid Google ID token'
      );
    }
  }

  /**
   * Check if Google OAuth is configured
   */
  public static isConfigured(): boolean {
    return !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
  }
}