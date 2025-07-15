"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const errorHandler_1 = require("./middleware/errorHandler");
const auth_1 = require("./routes/auth");
const cv_1 = require("./routes/cv");
const job_1 = require("./routes/job");
const email_1 = require("./routes/email");
const appInitializer_1 = require("./services/appInitializer");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Security middleware
app.use((0, helmet_1.default)());
// CORS configuration
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Health check endpoint for App Runner monitoring (no initialization required)
app.get('/health', async (req, res) => {
    try {
        const isInitialized = appInitializer_1.AppInitializer.isInitialized();
        res.status(200).json({
            status: isInitialized ? 'healthy' : 'initializing',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            initialized: isInitialized
        });
    }
    catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Health check failed'
        });
    }
});
// Ensure application is initialized before processing API requests
app.use('/api', appInitializer_1.ensureInitialized);
// API routes
app.use('/api/auth', auth_1.authRoutes);
app.use('/api/cv', cv_1.cvRoutes);
app.use('/api/job', job_1.jobRoutes);
app.use('/api/email', email_1.emailRoutes);
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
app.use(errorHandler_1.errorHandler);
// Start server
if (process.env.NODE_ENV !== 'test') {
    const startServer = async () => {
        try {
            // Initialize application before starting server
            await appInitializer_1.AppInitializer.initialize();
            app.listen(PORT, () => {
                console.log(`🚀 ASAP CV API Server running on port ${PORT}`);
                console.log(`📊 Health check available at http://localhost:${PORT}/health`);
                console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
                console.log(`✅ Application fully initialized and ready to serve requests`);
            });
        }
        catch (error) {
            console.error('❌ Failed to start server:', error);
            process.exit(1);
        }
    };
    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
        console.log('SIGTERM received, shutting down gracefully...');
        await appInitializer_1.AppInitializer.shutdown();
        process.exit(0);
    });
    process.on('SIGINT', async () => {
        console.log('SIGINT received, shutting down gracefully...');
        await appInitializer_1.AppInitializer.shutdown();
        process.exit(0);
    });
    startServer();
}
exports.default = app;
