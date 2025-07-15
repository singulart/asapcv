// Email-related type definitions
export interface EmailRequest {
  requestId: string;
  userEmail: string;
  jobUrl: string;
  status: 'processing' | 'completed' | 'failed';
  cvId?: string;
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface EmailResponse {
  success: boolean;
  message: string;
  attachmentUrl?: string;
}
