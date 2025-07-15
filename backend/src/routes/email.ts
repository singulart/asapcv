import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { createApiError } from '../middleware/errorHandler';
import { securityHeaders } from '../middleware/auth';

const router = Router();

// Apply security headers to email routes
router.use(securityHeaders);

// POST /api/email/process (internal endpoint for SES webhook)
router.post('/process', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Implement email processing logic for SES webhook
    res.status(501).json({
      message: 'Email processing endpoint - implementation pending (Internal use)',
      endpoint: 'POST /api/email/process'
    });
  } catch (error) {
    next(createApiError('Email processing failed', 500, 'EMAIL_PROCESS_ERROR'));
  }
});

export { router as emailRoutes };