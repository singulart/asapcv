// User-related type definitions
export interface User {
  userId: string;
  email: string;
  fullName: string;
  authProvider: 'local' | 'google';
  googleId?: string;
  passwordHash?: string;
  createdAt: string;
  updatedAt: string;
  baseCvId?: string;
}

export interface UserProfile {
  userId: string;
  email: string;
  fullName: string;
  createdAt: string;
  baseCvId?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
