import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { User, AuthTokens, UserProfile } from 'asap-cv-shared/dist/types/user';
import { LoginRequest, RegisterRequest } from 'asap-cv-shared/dist/types/api';
import { ErrorCode, createError, createResourceNotFoundError } from 'asap-cv-shared/dist/types/errors';
import { secretsManager } from './secretsManager';

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(process.env.NODE_ENV === 'development' && {
    endpoint: 'http://localhost:8000',
    credentials: {
      accessKeyId: 'dummy',
      secretAccessKey: 'dummy',
    },
  }),
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USERS_TABLE = process.env.USERS_TABLE || 'asap-cv-users';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export class AuthService {
  /**
   * Hash password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password against hash
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT tokens
   */
  private async generateTokens(userId: string, email: string): Promise<AuthTokens> {
    const payload = { userId, email };
    const jwtSecret = await secretsManager.getJwtSecret();
    
    const accessToken = jwt.sign(payload, jwtSecret, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'asap-cv',
      audience: 'asap-cv-users',
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(payload, jwtSecret, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      issuer: 'asap-cv',
      audience: 'asap-cv-users',
    } as jwt.SignOptions);

    // Calculate expiration time in seconds
    const expiresIn = this.parseExpirationTime(JWT_EXPIRES_IN);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Parse expiration time string to seconds
   */
  private parseExpirationTime(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 3600; // Default to 1 hour

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 3600;
    }
  }

  /**
   * Verify JWT token
   */
  public async verifyAccessToken(token: string): Promise<{ userId: string; email: string }> {
    try {
      const jwtSecret = await secretsManager.getJwtSecret();
      const decoded = jwt.verify(token, jwtSecret, {
        issuer: 'asap-cv',
        audience: 'asap-cv-users',
      }) as any;

      return {
        userId: decoded.userId,
        email: decoded.email,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw createError(ErrorCode.TOKEN_EXPIRED);
      }
      throw createError(ErrorCode.TOKEN_INVALID);
    }
  }

  /**
   * Verify refresh token
   */
  public async verifyRefreshToken(token: string): Promise<{ userId: string; email: string }> {
    try {
      const jwtSecret = await secretsManager.getJwtSecret();
      const decoded = jwt.verify(token, jwtSecret, {
        issuer: 'asap-cv',
        audience: 'asap-cv-users',
      }) as any;

      return {
        userId: decoded.userId,
        email: decoded.email,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw createError(ErrorCode.TOKEN_EXPIRED);
      }
      throw createError(ErrorCode.TOKEN_INVALID);
    }
  }

  /**
   * Find user by email
   */
  private async findUserByEmail(email: string): Promise<User | null> {
    try {
      const command = new QueryCommand({
        TableName: USERS_TABLE,
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': email,
        },
      });

      const result = await docClient.send(command);
      
      if (!result.Items || result.Items.length === 0) {
        return null;
      }

      return result.Items[0] as User;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw createError(ErrorCode.DATABASE_ERROR, 'Failed to query user by email');
    }
  }

  /**
   * Find user by ID
   */
  public async findUserById(userId: string): Promise<User | null> {
    try {
      const command = new GetCommand({
        TableName: USERS_TABLE,
        Key: { userId },
      });

      const result = await docClient.send(command);
      
      if (!result.Item) {
        return null;
      }

      return result.Item as User;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw createError(ErrorCode.DATABASE_ERROR, 'Failed to query user by ID');
    }
  }

  /**
   * Create new user
   */
  private async createUser(userData: {
    email: string;
    fullName: string;
    passwordHash?: string;
    authProvider: 'local' | 'google';
    googleId?: string;
  }): Promise<User> {
    const userId = uuidv4();
    const now = new Date();

    const user: User = {
      userId,
      email: userData.email,
      fullName: userData.fullName,
      authProvider: userData.authProvider,
      passwordHash: userData.passwordHash,
      googleId: userData.googleId,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const command = new PutCommand({
        TableName: USERS_TABLE,
        Item: user,
        ConditionExpression: 'attribute_not_exists(userId)',
      });

      await docClient.send(command);
      return user;
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw createError(ErrorCode.USER_ALREADY_EXISTS);
      }
      console.error('Error creating user:', error);
      throw createError(ErrorCode.DATABASE_ERROR, 'Failed to create user');
    }
  }

  /**
   * Register new user with email/password
   */
  public async register(registerData: RegisterRequest): Promise<{
    user: UserProfile;
    tokens: AuthTokens;
  }> {
    const { email, password, fullName } = registerData;

    // Check if user already exists
    const existingUser = await this.findUserByEmail(email);
    if (existingUser) {
      throw createError(ErrorCode.USER_ALREADY_EXISTS);
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const user = await this.createUser({
      email,
      fullName,
      passwordHash,
      authProvider: 'local',
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.userId, user.email);

    // Return user profile (without sensitive data)
    const userProfile: UserProfile = {
      userId: user.userId,
      email: user.email,
      fullName: user.fullName,
      createdAt: user.createdAt,
      baseCvId: user.baseCvId,
    };

    return { user: userProfile, tokens };
  }

  /**
   * Login user with email/password
   */
  public async login(loginData: LoginRequest): Promise<{
    user: UserProfile;
    tokens: AuthTokens;
  }> {
    const { email, password } = loginData;

    // Find user
    const user = await this.findUserByEmail(email);
    if (!user) {
      throw createError(ErrorCode.INVALID_CREDENTIALS);
    }

    // Verify password for local auth users
    if (user.authProvider === 'local') {
      if (!user.passwordHash) {
        throw createError(ErrorCode.INVALID_CREDENTIALS);
      }

      const isValidPassword = await this.verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        throw createError(ErrorCode.INVALID_CREDENTIALS);
      }
    } else {
      // OAuth users cannot login with password
      throw createError(ErrorCode.INVALID_CREDENTIALS, 'Please use Google OAuth to sign in');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.userId, user.email);

    // Return user profile (without sensitive data)
    const userProfile: UserProfile = {
      userId: user.userId,
      email: user.email,
      fullName: user.fullName,
      createdAt: user.createdAt,
      baseCvId: user.baseCvId,
    };

    return { user: userProfile, tokens };
  }

  /**
   * Refresh access token
   */
  public async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    // Verify refresh token
    const decoded = await this.verifyRefreshToken(refreshToken);

    // Verify user still exists
    const user = await this.findUserById(decoded.userId);
    if (!user) {
      throw createResourceNotFoundError('user', decoded.userId, ErrorCode.USER_NOT_FOUND);
    }

    // Generate new access token
    const jwtSecret = await secretsManager.getJwtSecret();
    const payload = { userId: user.userId, email: user.email };
    const accessToken = jwt.sign(payload, jwtSecret, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'asap-cv',
      audience: 'asap-cv-users',
    } as jwt.SignOptions);

    const expiresIn = this.parseExpirationTime(JWT_EXPIRES_IN);

    return { accessToken, expiresIn };
  }

  /**
   * Get user profile
   */
  public async getUserProfile(userId: string): Promise<UserProfile> {
    const user = await this.findUserById(userId);
    if (!user) {
      throw createResourceNotFoundError('user', userId, ErrorCode.USER_NOT_FOUND);
    }

    return {
      userId: user.userId,
      email: user.email,
      fullName: user.fullName,
      createdAt: user.createdAt,
      baseCvId: user.baseCvId,
    };
  }

  /**
   * Update user profile
   */
  public async updateUserProfile(
    userId: string,
    updates: { fullName?: string; email?: string }
  ): Promise<UserProfile> {
    const user = await this.findUserById(userId);
    if (!user) {
      throw createResourceNotFoundError('user', userId, ErrorCode.USER_NOT_FOUND);
    }

    // If email is being updated, check if it's already taken
    if (updates.email && updates.email !== user.email) {
      const existingUser = await this.findUserByEmail(updates.email);
      if (existingUser) {
        throw createError(ErrorCode.USER_ALREADY_EXISTS, 'Email address is already in use');
      }
    }

    // Update user
    const updatedUser: User = {
      ...user,
      fullName: updates.fullName || user.fullName,
      email: updates.email || user.email,
      updatedAt: new Date(),
    };

    try {
      const command = new PutCommand({
        TableName: USERS_TABLE,
        Item: updatedUser,
      });

      await docClient.send(command);

      return {
        userId: updatedUser.userId,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        createdAt: updatedUser.createdAt,
        baseCvId: updatedUser.baseCvId,
      };
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw createError(ErrorCode.DATABASE_ERROR, 'Failed to update user profile');
    }
  }

  /**
   * Create or update user from Google OAuth
   */
  public async handleGoogleOAuth(googleUserData: {
    googleId: string;
    email: string;
    fullName: string;
  }): Promise<{
    user: UserProfile;
    tokens: AuthTokens;
    isNewUser: boolean;
  }> {
    const { googleId, email, fullName } = googleUserData;

    // Check if user exists by email
    let user = await this.findUserByEmail(email);
    let isNewUser = false;

    if (!user) {
      // Create new user
      user = await this.createUser({
        email,
        fullName,
        authProvider: 'google',
        googleId,
      });
      isNewUser = true;
    } else if (user.authProvider === 'local') {
      // Link Google account to existing local account
      const updatedUser: User = {
        ...user,
        authProvider: 'google',
        googleId,
        updatedAt: new Date(),
      };

      const command = new PutCommand({
        TableName: USERS_TABLE,
        Item: updatedUser,
      });

      await docClient.send(command);
      user = updatedUser;
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.userId, user.email);

    // Return user profile
    const userProfile: UserProfile = {
      userId: user.userId,
      email: user.email,
      fullName: user.fullName,
      createdAt: user.createdAt,
      baseCvId: user.baseCvId,
    };

    return { user: userProfile, tokens, isNewUser };
  }
}