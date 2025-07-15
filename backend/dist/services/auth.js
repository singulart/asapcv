"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const errors_1 = require("../../../shared/src/types/errors");
// Initialize DynamoDB client
const dynamoClient = new client_dynamodb_1.DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
    ...(process.env.NODE_ENV === 'development' && {
        endpoint: 'http://localhost:8000',
        credentials: {
            accessKeyId: 'dummy',
            secretAccessKey: 'dummy',
        },
    }),
});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
const USERS_TABLE = process.env.USERS_TABLE || 'asap-cv-users';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
class AuthService {
    /**
     * Hash password using bcrypt
     */
    async hashPassword(password) {
        const saltRounds = 12;
        return bcryptjs_1.default.hash(password, saltRounds);
    }
    /**
     * Verify password against hash
     */
    async verifyPassword(password, hash) {
        return bcryptjs_1.default.compare(password, hash);
    }
    /**
     * Generate JWT tokens
     */
    generateTokens(userId, email) {
        const payload = { userId, email };
        const accessToken = jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
            issuer: 'asap-cv',
            audience: 'asap-cv-users',
        });
        const refreshToken = jsonwebtoken_1.default.sign(payload, JWT_REFRESH_SECRET, {
            expiresIn: JWT_REFRESH_EXPIRES_IN,
            issuer: 'asap-cv',
            audience: 'asap-cv-users',
        });
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
    parseExpirationTime(expiresIn) {
        const match = expiresIn.match(/^(\d+)([smhd])$/);
        if (!match)
            return 3600; // Default to 1 hour
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
    verifyAccessToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET, {
                issuer: 'asap-cv',
                audience: 'asap-cv-users',
            });
            return {
                userId: decoded.userId,
                email: decoded.email,
            };
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw (0, errors_1.createError)(errors_1.ErrorCode.TOKEN_EXPIRED);
            }
            throw (0, errors_1.createError)(errors_1.ErrorCode.TOKEN_INVALID);
        }
    }
    /**
     * Verify refresh token
     */
    verifyRefreshToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_REFRESH_SECRET, {
                issuer: 'asap-cv',
                audience: 'asap-cv-users',
            });
            return {
                userId: decoded.userId,
                email: decoded.email,
            };
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw (0, errors_1.createError)(errors_1.ErrorCode.TOKEN_EXPIRED);
            }
            throw (0, errors_1.createError)(errors_1.ErrorCode.TOKEN_INVALID);
        }
    }
    /**
     * Find user by email
     */
    async findUserByEmail(email) {
        try {
            const command = new lib_dynamodb_1.QueryCommand({
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
            return result.Items[0];
        }
        catch (error) {
            console.error('Error finding user by email:', error);
            throw (0, errors_1.createError)(errors_1.ErrorCode.DATABASE_ERROR, 'Failed to query user by email');
        }
    }
    /**
     * Find user by ID
     */
    async findUserById(userId) {
        try {
            const command = new lib_dynamodb_1.GetCommand({
                TableName: USERS_TABLE,
                Key: { userId },
            });
            const result = await docClient.send(command);
            if (!result.Item) {
                return null;
            }
            return result.Item;
        }
        catch (error) {
            console.error('Error finding user by ID:', error);
            throw (0, errors_1.createError)(errors_1.ErrorCode.DATABASE_ERROR, 'Failed to query user by ID');
        }
    }
    /**
     * Create new user
     */
    async createUser(userData) {
        const userId = (0, uuid_1.v4)();
        const now = new Date();
        const user = {
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
            const command = new lib_dynamodb_1.PutCommand({
                TableName: USERS_TABLE,
                Item: user,
                ConditionExpression: 'attribute_not_exists(userId)',
            });
            await docClient.send(command);
            return user;
        }
        catch (error) {
            if (error.name === 'ConditionalCheckFailedException') {
                throw (0, errors_1.createError)(errors_1.ErrorCode.USER_ALREADY_EXISTS);
            }
            console.error('Error creating user:', error);
            throw (0, errors_1.createError)(errors_1.ErrorCode.DATABASE_ERROR, 'Failed to create user');
        }
    }
    /**
     * Register new user with email/password
     */
    async register(registerData) {
        const { email, password, fullName } = registerData;
        // Check if user already exists
        const existingUser = await this.findUserByEmail(email);
        if (existingUser) {
            throw (0, errors_1.createError)(errors_1.ErrorCode.USER_ALREADY_EXISTS);
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
        const tokens = this.generateTokens(user.userId, user.email);
        // Return user profile (without sensitive data)
        const userProfile = {
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
    async login(loginData) {
        const { email, password } = loginData;
        // Find user
        const user = await this.findUserByEmail(email);
        if (!user) {
            throw (0, errors_1.createError)(errors_1.ErrorCode.INVALID_CREDENTIALS);
        }
        // Verify password for local auth users
        if (user.authProvider === 'local') {
            if (!user.passwordHash) {
                throw (0, errors_1.createError)(errors_1.ErrorCode.INVALID_CREDENTIALS);
            }
            const isValidPassword = await this.verifyPassword(password, user.passwordHash);
            if (!isValidPassword) {
                throw (0, errors_1.createError)(errors_1.ErrorCode.INVALID_CREDENTIALS);
            }
        }
        else {
            // OAuth users cannot login with password
            throw (0, errors_1.createError)(errors_1.ErrorCode.INVALID_CREDENTIALS, 'Please use Google OAuth to sign in');
        }
        // Generate tokens
        const tokens = this.generateTokens(user.userId, user.email);
        // Return user profile (without sensitive data)
        const userProfile = {
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
    async refreshToken(refreshToken) {
        // Verify refresh token
        const decoded = this.verifyRefreshToken(refreshToken);
        // Verify user still exists
        const user = await this.findUserById(decoded.userId);
        if (!user) {
            throw (0, errors_1.createResourceNotFoundError)('user', decoded.userId, errors_1.ErrorCode.USER_NOT_FOUND);
        }
        // Generate new access token
        const payload = { userId: user.userId, email: user.email };
        const accessToken = jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
            issuer: 'asap-cv',
            audience: 'asap-cv-users',
        });
        const expiresIn = this.parseExpirationTime(JWT_EXPIRES_IN);
        return { accessToken, expiresIn };
    }
    /**
     * Get user profile
     */
    async getUserProfile(userId) {
        const user = await this.findUserById(userId);
        if (!user) {
            throw (0, errors_1.createResourceNotFoundError)('user', userId, errors_1.ErrorCode.USER_NOT_FOUND);
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
    async updateUserProfile(userId, updates) {
        const user = await this.findUserById(userId);
        if (!user) {
            throw (0, errors_1.createResourceNotFoundError)('user', userId, errors_1.ErrorCode.USER_NOT_FOUND);
        }
        // If email is being updated, check if it's already taken
        if (updates.email && updates.email !== user.email) {
            const existingUser = await this.findUserByEmail(updates.email);
            if (existingUser) {
                throw (0, errors_1.createError)(errors_1.ErrorCode.USER_ALREADY_EXISTS, 'Email address is already in use');
            }
        }
        // Update user
        const updatedUser = {
            ...user,
            fullName: updates.fullName || user.fullName,
            email: updates.email || user.email,
            updatedAt: new Date(),
        };
        try {
            const command = new lib_dynamodb_1.PutCommand({
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
        }
        catch (error) {
            console.error('Error updating user profile:', error);
            throw (0, errors_1.createError)(errors_1.ErrorCode.DATABASE_ERROR, 'Failed to update user profile');
        }
    }
    /**
     * Create or update user from Google OAuth
     */
    async handleGoogleOAuth(googleUserData) {
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
        }
        else if (user.authProvider === 'local') {
            // Link Google account to existing local account
            const updatedUser = {
                ...user,
                authProvider: 'google',
                googleId,
                updatedAt: new Date(),
            };
            const command = new lib_dynamodb_1.PutCommand({
                TableName: USERS_TABLE,
                Item: updatedUser,
            });
            await docClient.send(command);
            user = updatedUser;
        }
        // Generate tokens
        const tokens = this.generateTokens(user.userId, user.email);
        // Return user profile
        const userProfile = {
            userId: user.userId,
            email: user.email,
            fullName: user.fullName,
            createdAt: user.createdAt,
            baseCvId: user.baseCvId,
        };
        return { user: userProfile, tokens, isNewUser };
    }
}
exports.AuthService = AuthService;
