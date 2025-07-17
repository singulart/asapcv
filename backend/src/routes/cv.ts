import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { createApiError } from '../middleware/errorHandler';
import { authenticateToken, validateUserDataIsolation, securityHeaders } from '../middleware/auth';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';

const router = Router();

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Validation schema for CV upload request
const cvUploadSchema = Joi.object({
  filename: Joi.string().required().min(1).max(255),
  fileType: Joi.string().valid('application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document').required(),
  fileSize: Joi.number().integer().min(1).max(10 * 1024 * 1024).required(), // Max 10MB
  title: Joi.string().optional().min(1).max(100)
});

// Apply security headers and authentication to all CV routes
router.use(securityHeaders);
router.use(authenticateToken);
router.use(validateUserDataIsolation);

// POST /api/cv/upload
router.post('/upload', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const { error, value } = cvUploadSchema.validate(req.body);
    if (error) {
      return next(createApiError(`Validation error: ${error.details[0].message}`, 400, 'VALIDATION_ERROR'));
    }

    const { filename, fileType, fileSize, title } = value;
    const userId = (req as any).user.userId;

    // Generate unique file key for S3
    const uniqueFilename = `${uuidv4()}-${filename}`;
    const s3Key = `cvs/${userId}/${uniqueFilename}`;

    // Generate CV ID for tracking
    const cvId = uuidv4();

    // Create presigned URL for file upload
    const putObjectCommand = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || 'asap-cv-dev-cv-files',
      Key: s3Key,
      ContentType: fileType,
      ContentLength: fileSize,
      Metadata: {
        userId: userId,
        originalFilename: filename,
        cvId: cvId,
        uploadedAt: new Date().toISOString()
      }
    });

    const presignedUrl = await getSignedUrl(s3Client, putObjectCommand, {
      expiresIn: 300 // 5 minutes
    });

    // Return presigned URL and upload metadata
    res.status(200).json({
      cvId,
      s3Key,
      uploadUrl: presignedUrl
    });

  } catch (error) {
    console.error('CV upload error:', error);
    next(createApiError('Failed to generate upload URL', 500, 'CV_UPLOAD_ERROR'));
  }
});

// Helper function to get file extension from MIME type
function getFileExtension(mimeType: string): string {
  switch (mimeType) {
    case 'application/pdf':
      return '.pdf';
    case 'application/msword':
      return '.doc';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return '.docx';
    default:
      return '';
  }
}

// GET /api/cv/versions
router.get('/versions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Implement CV versions retrieval logic
    res.status(501).json({
      message: 'CV versions endpoint - implementation pending',
      endpoint: 'GET /api/cv/versions'
    });
  } catch (error) {
    next(createApiError('CV versions retrieval failed', 500, 'CV_VERSIONS_ERROR'));
  }
});

// GET /api/cv/versions/:id
router.get('/versions/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Implement specific CV version retrieval logic
    res.status(501).json({
      message: 'CV version retrieval endpoint - implementation pending',
      endpoint: `GET /api/cv/versions/${req.params.id}`
    });
  } catch (error) {
    next(createApiError('CV version retrieval failed', 500, 'CV_VERSION_ERROR'));
  }
});

// DELETE /api/cv/versions/:id
router.delete('/versions/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Implement CV version deletion logic
    res.status(501).json({
      message: 'CV version deletion endpoint - implementation pending',
      endpoint: `DELETE /api/cv/versions/${req.params.id}`
    });
  } catch (error) {
    next(createApiError('CV version deletion failed', 500, 'CV_DELETE_ERROR'));
  }
});

// POST /api/cv/tailor (Rate Limited: 1 req/15s per user)
router.post('/tailor', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Implement CV tailoring logic with rate limiting
    res.status(501).json({
      message: 'CV tailoring endpoint - implementation pending (Rate Limited: 1 req/15s)',
      endpoint: 'POST /api/cv/tailor'
    });
  } catch (error) {
    next(createApiError('CV tailoring failed', 500, 'CV_TAILOR_ERROR'));
  }
});

// GET /api/cv/preview/:id
router.get('/preview/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Implement CV preview logic
    res.status(501).json({
      message: 'CV preview endpoint - implementation pending',
      endpoint: `GET /api/cv/preview/${req.params.id}`
    });
  } catch (error) {
    next(createApiError('CV preview failed', 500, 'CV_PREVIEW_ERROR'));
  }
});

// POST /api/cv/download/:id
router.post('/download/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Implement CV download logic
    res.status(501).json({
      message: 'CV download endpoint - implementation pending',
      endpoint: `POST /api/cv/download/${req.params.id}`
    });
  } catch (error) {
    next(createApiError('CV download failed', 500, 'CV_DOWNLOAD_ERROR'));
  }
});

export { router as cvRoutes };