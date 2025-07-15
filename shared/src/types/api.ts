// API request/response type definitions
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: Date;
  rateLimitInfo?: RateLimitInfo;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

// Authentication API Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    userId: string;
    email: string;
    fullName: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface RegisterResponse {
  user: {
    userId: string;
    email: string;
    fullName: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

export interface GoogleOAuthRequest {
  code: string;
  state?: string;
}

// Profile API Types
export interface UpdateProfileRequest {
  fullName?: string;
  email?: string;
}

export interface ProfileResponse {
  userId: string;
  email: string;
  fullName: string;
  createdAt: Date;
  baseCvId?: string;
}

// CV API Types
export interface CvUploadRequest {
  file: File;
  title?: string;
}

export interface CvUploadResponse {
  cvId: string;
  title: string;
  isBase: boolean;
  processingStatus: 'processing' | 'completed' | 'failed';
}

export interface CvVersionsResponse {
  cvs: Array<{
    cvId: string;
    title: string;
    isBase: boolean;
    jobUrl?: string;
    createdAt: Date;
    modifiedSections: string[];
  }>;
}

export interface CvDetailResponse {
  cvId: string;
  userId: string;
  title: string;
  isBase: boolean;
  jobUrl?: string;
  content: {
    summary: string;
    experience: Array<{
      company: string;
      position: string;
      startDate: string;
      endDate?: string;
      description: string[];
      location?: string;
    }>;
    education: Array<{
      institution: string;
      degree: string;
      field: string;
      startDate: string;
      endDate?: string;
      gpa?: string;
      location?: string;
    }>;
    skills: string[];
    contact: {
      fullName: string;
      email: string;
      phone?: string;
      address?: string;
      linkedin?: string;
      website?: string;
    };
  };
  createdAt: Date;
  modifiedSections: string[];
}

// Job Analysis API Types
export interface JobAnalyzeRequest {
  jobUrl: string;
}

export interface JobAnalyzeResponse {
  jobId: string;
  title: string;
  company: string;
  requirements: string[];
  responsibilities: string[];
  keywords: string[];
  matchingElements: string[];
  missingElements: string[];
}

// CV Tailoring API Types
export interface CvTailorRequest {
  jobUrl: string;
  baseCvId?: string;
}

export interface CvTailorResponse {
  cvId: string;
  title: string;
  jobUrl: string;
  modifiedSections: string[];
  processingStatus: 'processing' | 'completed' | 'failed';
}

// CV Preview API Types
export interface CvPreviewResponse {
  cvId: string;
  title: string;
  content: {
    summary: string;
    experience: Array<{
      company: string;
      position: string;
      startDate: string;
      endDate?: string;
      description: string[];
      location?: string;
    }>;
    education: Array<{
      institution: string;
      degree: string;
      field: string;
      startDate: string;
      endDate?: string;
      gpa?: string;
      location?: string;
    }>;
    skills: string[];
    contact: {
      fullName: string;
      email: string;
      phone?: string;
      address?: string;
      linkedin?: string;
      website?: string;
    };
  };
  modifiedSections: string[];
  highlightedChanges: {
    [sectionName: string]: {
      original: string;
      modified: string;
    };
  };
}

// CV Download API Types
export interface CvDownloadRequest {
  format?: 'pdf' | 'docx';
}

export interface CvDownloadResponse {
  downloadUrl: string;
  filename: string;
  expiresAt: Date;
}

// Email Processing API Types (Internal)
export interface EmailProcessRequest {
  messageId: string;
  from: string;
  subject: string;
  body: string;
  timestamp: Date;
}

export interface EmailProcessResponse {
  requestId: string;
  status: 'processing' | 'completed' | 'failed';
  message: string;
}
