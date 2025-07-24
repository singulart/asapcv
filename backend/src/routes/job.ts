import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { createApiError } from '../middleware/errorHandler';
import { authenticateToken, securityHeaders } from '../middleware/auth';
import { WebScraperService } from '../services/webScraper';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { ErrorCode, createError, formatErrorResponse } from 'asap-cv-shared';

const router = Router();
const webScraperService = new WebScraperService();

// Apply security headers and authentication to all job routes
router.use(securityHeaders);
router.use(authenticateToken);

// Validation schema for job URL
const jobUrlSchema = Joi.object({
  url: Joi.string().uri({ scheme: ['http', 'https'] }).required().max(2048)
    .messages({
      'string.uri': 'Invalid URL format. Please provide a valid HTTP or HTTPS URL.',
      'string.max': 'URL is too long. Maximum length is 2048 characters.',
      'any.required': 'Job URL is required.'
    })
});

// POST /api/job/analyze (Rate Limited: 1 req/15s per user)
router.post('/analyze', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const { error, value } = jobUrlSchema.validate(req.body);
    if (error) {
      const validationError = createError(
        ErrorCode.VALIDATION_ERROR,
        `Validation error: ${error.details[0].message}`,
        { field: String(error.details[0].path[0]), value: error.details[0].context?.value }
      );
      return res.status(400).json(formatErrorResponse(validationError));
    }

    const { url } = value;
    const userId = req.user?.userId;

    if (!userId) {
      const authError = createError(ErrorCode.UNAUTHORIZED, 'User ID not found in request');
      return res.status(401).json(formatErrorResponse(authError));
    }

    // Generate job ID
    const jobId = uuidv4();

    try {
      // Fetch and extract job information
      const jobInfo = await webScraperService.fetchJobInfo(url);

      // TODO: In a future task, we'll implement storing this in DynamoDB
      // and integrating with Amazon Bedrock for analysis

      // Return job information
      res.status(200).json({
        success: true,
        jobId,
        url: jobInfo.url,
        title: jobInfo.title || 'Unknown Position',
        company: jobInfo.company || 'Unknown Company',
        contentLength: jobInfo.content.length,
        contentPreview: jobInfo.content.substring(0, 200) + '...',
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      // Handle specific error types
      if (error.code === ErrorCode.INVALID_URL) {
        return res.status(400).json(formatErrorResponse(error));
      }

      if (error.code === ErrorCode.JOB_FETCH_FAILED) {
        return res.status(502).json(formatErrorResponse(error));
      }

      if (error.code === ErrorCode.JOB_CONTENT_INSUFFICIENT) {
        return res.status(400).json(formatErrorResponse(error));
      }

      // For unexpected errors
      const serverError = createError(
        ErrorCode.INTERNAL_SERVER_ERROR,
        'An unexpected error occurred while analyzing the job URL',
        { context: { originalError: error.message } }
      );
      return res.status(500).json(formatErrorResponse(serverError));
    }
  } catch (error: any) {
    console.error('Job analysis error:', error);
    next(createApiError('Job analysis failed', 500, 'JOB_ANALYZE_ERROR'));
  }
});

export { router as jobRoutes };