// API request/response type definitions
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: Date;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface CvUploadRequest {
  file: File;
}

export interface JobAnalyzeRequest {
  jobUrl: string;
}

export interface CvTailorRequest {
  jobUrl: string;
  baseCvId?: string;
}