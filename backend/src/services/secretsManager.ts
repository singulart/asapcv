import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { ErrorCode, createError } from 'asap-cv-shared/dist/types/errors';

interface SecretsCache {
  [key: string]: any;
  lastUpdated: number;
}

export class SecretsManagerService {
  private client: SecretsManagerClient;
  private cache: SecretsCache = { lastUpdated: 0 };
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly region: string;

  constructor() {
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.client = new SecretsManagerClient({ region: this.region });
  }

  /**
   * Get a secret value from AWS Secrets Manager with caching
   */
  async getSecret(secretArn: string): Promise<any> {
    try {
      // Check cache first
      const now = Date.now();
      if (this.cache[secretArn] && (now - this.cache.lastUpdated) < this.CACHE_TTL) {
        return this.cache[secretArn];
      }

      const command = new GetSecretValueCommand({
        SecretId: secretArn,
      });

      const response = await this.client.send(command);
      
      if (!response.SecretString) {
        throw createError(
          ErrorCode.INTERNAL_SERVER_ERROR,
          `Secret ${secretArn} has no string value`
        );
      }

      const secretValue = JSON.parse(response.SecretString);
      
      // Cache the result
      this.cache[secretArn] = secretValue;
      this.cache.lastUpdated = now;

      return secretValue;
    } catch (error: any) {
      console.error(`Failed to retrieve secret ${secretArn}:`, error);
      throw createError(
        ErrorCode.INTERNAL_SERVER_ERROR,
        `Failed to retrieve secret: ${error.message}`
      );
    }
  }

  /**
   * Get JWT secret
   */
  async getJwtSecret(): Promise<string> {
    const jwtSecretArn = process.env.JWT_SECRET;
    if (!jwtSecretArn) {
      throw createError(
        ErrorCode.INTERNAL_SERVER_ERROR,
        'JWT_SECRET environment variable not configured'
      );
    }

    const secrets = await this.getSecret(jwtSecretArn);
    return secrets.JWT_SECRET;
  }

  /**
   * Get Google OAuth credentials
   */
  async getGoogleOAuthCredentials(): Promise<{
    clientId: string;
    clientSecret: string;
  } | null> {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

    // If environment variables are not set, Google OAuth is not configured
    if (!googleClientId || !googleClientSecret) {
      return null;
    }

    try {
      // For App Runner, the secrets are injected as environment variables
      // But we still need to handle the case where they might be ARNs
      if (googleClientId.startsWith('arn:aws:secretsmanager:')) {
        const secrets = await this.getSecret(googleClientId.split(':')[0]);
        return {
          clientId: secrets.GOOGLE_CLIENT_ID,
          clientSecret: secrets.GOOGLE_CLIENT_SECRET,
        };
      }

      // Direct environment variable values
      return {
        clientId: googleClientId,
        clientSecret: googleClientSecret,
      };
    } catch (error) {
      console.warn('Failed to load Google OAuth credentials:', error);
      return null;
    }
  }

  /**
   * Initialize all secrets at application startup
   */
  async initializeSecrets(): Promise<void> {
    try {
      console.log('Initializing secrets from AWS Secrets Manager...');
      
      // Load JWT secret
      await this.getJwtSecret();
      console.log('✓ JWT secret loaded');

      // Load Google OAuth credentials if configured
      const googleCreds = await this.getGoogleOAuthCredentials();
      if (googleCreds) {
        console.log('✓ Google OAuth credentials loaded');
      } else {
        console.log('ℹ Google OAuth not configured');
      }

      console.log('Secrets initialization complete');
    } catch (error) {
      console.error('Failed to initialize secrets:', error);
      throw error;
    }
  }

  /**
   * Clear the secrets cache (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.cache = { lastUpdated: 0 };
  }

  /**
   * Health check for secrets access
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.getJwtSecret();
      return true;
    } catch (error) {
      console.error('Secrets health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const secretsManager = new SecretsManagerService();