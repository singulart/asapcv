import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './routes/auth';
import { cvRoutes } from './routes/cv';
import { jobRoutes } from './routes/job';
import { emailRoutes } from './routes/email';
import { AppInitializer, ensureInitialized } from './services/appInitializer';

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint for App Runner monitoring (no initialization required)
app.get('/health', async (req, res) => {
  try {
    const isInitialized = AppInitializer.isInitialized();
    res.status(200).json({
      status: isInitialized ? 'healthy' : 'initializing',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      initialized: isInitialized
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// Ensure application is initialized before processing API requests
app.use('/api', ensureInitialized);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/cv', cvRoutes);
app.use('/api/job', jobRoutes);
app.use('/api/email', emailRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'ASAP CV API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      cv: '/api/cv',
      job: '/api/job',
      email: '/api/email'
    }
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== 'test') {
  const startServer = async () => {
    try {
      // Initialize application before starting server
      await AppInitializer.initialize();
      
      app.listen(PORT, () => {
        console.log(`🚀 ASAP CV API Server running on port ${PORT}`);
        console.log(`📊 Health check available at http://localhost:${PORT}/health`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`✅ Application fully initialized and ready to serve requests`);
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  };

  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await AppInitializer.shutdown();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    await AppInitializer.shutdown();
    process.exit(0);
  });

  startServer();
}

export default app;