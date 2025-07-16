import { secretsManager } from './secretsManager';
import { ErrorCode, createError } from 'asap-cv-shared/src/types/errors';

export class AppInitializer {
  private static initialized = false;
  private static initializationPromise: Promise<void> | null = null;

  /**
   * Initialize the application with all required secrets and services
   */
  public static async initialize(): Promise<void> {
    // Prevent multiple initialization attempts
    if (this.initialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private static async performInitialization(): Promise<void> {
    try {
      console.log('🚀 Starting ASAP CV application initialization...');

      // Initialize secrets manager
      await secretsManager.initializeSecrets();

      // Perform health checks
      await this.performHealthChecks();

      this.initialized = true;
      console.log('✅ Application initialization completed successfully');
    } catch (error) {
      console.error('❌ Application initialization failed:', error);
      throw createError(
        ErrorCode.INTERNAL_SERVER_ERROR,
        `Application initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Perform health checks on critical services
   */
  private static async performHealthChecks(): Promise<void> {
    console.log('🔍 Performing health checks...');

    // Check secrets manager
    const secretsHealthy = await secretsManager.healthCheck();
    if (!secretsHealthy) {
      throw new Error('Secrets Manager health check failed');
    }
    console.log('✓ Secrets Manager is healthy');

    // Check environment variables
    this.checkRequiredEnvironmentVariables();
    console.log('✓ Environment variables are configured');

    console.log('✅ All health checks passed');
  }

  /**
   * Check that required environment variables are set
   */
  private static checkRequiredEnvironmentVariables(): void {
    const requiredEnvVars = [
      'AWS_REGION',
      'NODE_ENV',
      'JWT_SECRET', // This should be the ARN from Secrets Manager
    ];

    const optionalEnvVars = [
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
    ];

    const missing: string[] = [];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        missing.push(envVar);
      }
    }

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Log optional environment variables status
    for (const envVar of optionalEnvVars) {
      if (process.env[envVar]) {
        console.log(`✓ ${envVar} is configured`);
      } else {
        console.log(`ℹ ${envVar} is not configured (optional)`);
      }
    }
  }

  /**
   * Get initialization status
   */
  public static isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Force re-initialization (useful for testing)
   */
  public static async reinitialize(): Promise<void> {
    this.initialized = false;
    this.initializationPromise = null;
    secretsManager.clearCache();
    await this.initialize();
  }

  /**
   * Graceful shutdown
   */
  public static async shutdown(): Promise<void> {
    console.log('🛑 Shutting down application...');
    
    // Clear secrets cache
    secretsManager.clearCache();
    
    this.initialized = false;
    this.initializationPromise = null;
    
    console.log('✅ Application shutdown completed');
  }
}

/**
 * Middleware to ensure application is initialized before processing requests
 */
export const ensureInitialized = async (req: any, res: any, next: any): Promise<void> => {
  try {
    if (!AppInitializer.isInitialized()) {
      console.log('Application not initialized, initializing now...');
      await AppInitializer.initialize();
    }
    next();
  } catch (error) {
    console.error('Failed to initialize application:', error);
    res.status(503).json({
      success: false,
      error: {
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: 'Service is temporarily unavailable during initialization',
        timestamp: new Date(),
      },
      timestamp: new Date(),
    });
  }
};