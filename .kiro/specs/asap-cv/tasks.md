# Implementation Plan

- [x] 1. Set up project structure and development environment
  - Create monorepo structure with Angular frontend and Node.js backend directories
  - Configure TypeScript, ESLint, and Prettier for both frontend and backend
  - Set up package.json files with required dependencies for Angular and AWS SDK
  - Create basic folder structure for components, services, API routes, and shared types
  - _Requirements: All requirements depend on proper project setup_

- [x] 2. Implement core data models and interfaces
  - Create TypeScript interfaces for User, CV, JobAnalysis, and EmailRequest models
  - Define API request/response interfaces for all endpoints
  - Create shared validation schemas using Joi or similar library
  - Implement error response interfaces and standardized error handling types
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 7.1, 8.1_

- [x] 3. Set up containerized backend infrastructure
- [x] 3.1 Create Express.js API server
  - Set up Express.js server with TypeScript configuration
  - Create API route structure for all endpoints (auth, cv, job, email)
  - Implement middleware for CORS, body parsing, and error handling
  - Add health check endpoint for App Runner monitoring
  - _Requirements: All API endpoints need Express server foundation_

- [x] 3.2 Create Docker configuration for backend
  - Write Dockerfile for Node.js backend with multi-stage build
  - Create docker-compose.yml for local development with DynamoDB Local
  - Configure .dockerignore for optimized container builds
  - Set up environment variable configuration for different deployment stages
  - _Requirements: App Runner requires containerized deployment_

- [x] 3.3 Set up AWS infrastructure and DynamoDB tables
  - Create Terraform configuration for DynamoDB tables (Users, CVs, JobAnalyses, EmailRequests, RateLimits)
  - Configure table schemas with proper primary keys, GSIs, and TTL settings
  - Set up IAM roles and policies for App Runner service to access DynamoDB
  - Create S3 bucket for CV file storage with proper CORS configuration
  - _Requirements: 1.3, 4.1, 5.6, 7.1, 7.3_

- [x] 4. Implement authentication system
- [x] 4.1 Create authentication API routes
  - Write POST /auth/login route with JWT token generation
  - Write POST /auth/register route with user creation in DynamoDB
  - Write POST /auth/refresh route for token renewal
  - Implement password hashing and validation utilities
  - _Requirements: 5.1, 5.4, 5.5, 5.7_

- [x] 4.2 Implement Google OAuth integration
  - Set up Google OAuth configuration and credentials
  - Create GET /auth/google and GET /auth/google/callback routes
  - Implement user consent handling for email and full name access
  - Write user profile creation logic for OAuth users
  - _Requirements: 5.2, 5.3_

- [x] 4.3 Create authentication middleware and security
  - Implement JWT validation middleware for protected routes
  - Create user authorization checks for data access
  - Write session management and security utilities
  - Implement user data isolation validation
  - _Requirements: 5.5, 5.6, 7.1, 7.2, 7.3, 7.4_

- [ ] 5. Build CV upload and processing system
- [x] 5.1 Implement CV file upload functionality
  - Create POST /cv/upload backend API to handle file uploads to S3
  - This API should accept file metadata (filename, file type, file size) and return a presigned upload URL. No actual file upload should be done as part of this API
  - Implement client CV upload component 
  - Add client validation for PDF, DOC, and DOCX formats 
  - Add client functionality to call /cv/upload, receive the presigned url and perform file upload by using that presigned url
  - Once upload completes, add nice UX to inform user
  - _Requirements: 1.1, 1.2, 1.4_

- [ ] 5.2 Integrate Amazon Bedrock for CV analysis
  - Set up Amazon Bedrock client configuration with Claude models
  - Create CV processing service to analyze CV content using Bedrock
  - Implement prompt engineering for CV section extraction and parsing
  - Write CV content structuring logic to organize parsed data
  - _Requirements: 1.2, 1.3_

- [ ] 5.3 Implement CV storage and version management
  - Create GET /cv/versions and GET /cv/versions/:id API routes
  - Implement CV version management with base CV identification
  - Write CV retrieval functions with user authorization checks
  - Create DELETE /cv/versions/:id route with base CV protection
  - _Requirements: 1.3, 1.5, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 6. Build job description processing system
- [x] 6.1 Implement job URL fetching and content extraction
  - Create POST /job/analyze API route to scrape job descriptions from URLs
  - Implement web scraping utilities with proper error handling
  - Write URL validation and sanitization logic
  - Create fallback mechanisms for failed URL fetching
  - _Requirements: 2.1, 2.2, 2.5_

- [ ] 6.2 Integrate Bedrock for job analysis
  - Create job analysis service using Amazon Bedrock
  - Implement prompt engineering for extracting job requirements and keywords
  - Write job content parsing logic to identify skills and responsibilities
  - Create job analysis result storage in DynamoDB
  - _Requirements: 2.3, 2.4, 2.7_

- [ ] 6.3 Add job processing error handling
  - Implement comprehensive error handling for URL fetching failures
  - Create user-friendly error messages with troubleshooting suggestions
  - Write retry logic for transient failures
  - Add validation for insufficient job content
  - _Requirements: 2.5, 2.6_

- [ ] 7. Implement AI-powered CV tailoring system
- [ ] 7.1 Create CV tailoring engine with Bedrock
  - Write POST /cv/tailor API route using Amazon Bedrock Claude Sonnet
  - Implement prompt engineering for generating tailored CV summaries
  - Create bullet point generation logic matching job qualifications
  - Write employment section replacement functionality
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 7.2 Implement rate limiting for AI endpoints
  - Create rate limiting middleware using DynamoDB for request tracking
  - Implement 15-second throttling for job analysis and CV tailoring endpoints
  - Write rate limit validation logic with user-friendly error messages
  - Add rate limit status indicators in API responses
  - _Requirements: Rate limiting requirement from design_

- [ ] 7.3 Build CV generation and formatting
  - Create CV generation service to produce formatted PDFs
  - Implement PDF generation maintaining original CV structure and formatting
  - Write tailored CV storage logic with modification tracking
  - Create CV preview functionality with highlighted changes
  - _Requirements: 3.4, 3.5, 3.6, 3.7_

- [ ] 8. Implement CV preview and download system
- [ ] 8.1 Create CV preview functionality
  - Write GET /cv/preview/:id API endpoint to display tailored CV content
  - Implement change highlighting to show modified sections
  - Create preview rendering logic maintaining original formatting
  - Add preview validation and error handling
  - _Requirements: 6.1, 6.2_

- [ ] 8.2 Build PDF download system
  - Create POST /cv/download/:id API route for PDF generation
  - Implement high-quality PDF formatting with proper styling
  - Write download endpoint with proper file headers and content-type
  - Add automatic CV version saving to user profile
  - _Requirements: 6.3, 6.4, 6.5_

- [ ] 9. Build email-based CV tailoring system
- [ ] 9.1 Set up email processing infrastructure
  - Configure AWS SES to receive emails at asapcv@argorand.io
  - Create POST /email/process API route for SES webhook integration
  - Implement email parsing to extract sender and job URLs
  - Write sender verification against registered user accounts
  - _Requirements: 8.1, 8.6_

- [ ] 9.2 Implement automated email CV processing
  - Create background job processing service for email-triggered CV tailoring
  - Implement automatic CV tailoring using user's base CV and extracted job URL
  - Write email response system to send tailored CVs as PDF attachments
  - Add processing status tracking and error handling
  - _Requirements: 8.2, 8.3, 8.4, 8.5_

- [ ] 9.3 Add email error handling and user guidance
  - Implement error responses for unregistered email addresses
  - Create format instruction responses for invalid email content
  - Write signup instruction emails for non-users
  - Add email processing failure notifications
  - _Requirements: 8.6, 8.7_

- [ ] 10. Build Angular frontend application
- [ ] 10.1 Create core Angular components and routing
  - Set up Angular application with routing and lazy loading
  - Create AuthComponent with login/signup forms and Google OAuth integration
  - Integrate AuthComponent with the backend API
  - Build DashboardComponent showing user's CV versions and quick actions
  - Implement responsive design with mobile-first approach
  - _Requirements: 5.1, 5.2, 5.3, 9.4_

- [ ] 10.2 Implement CV management interface
  - Create UploadComponent for CV file upload with drag-and-drop
  - Build JobUrlComponent for job description URL input
  - Implement PreviewComponent with change highlighting and download options
  - Create ProfileComponent for user account management
  - _Requirements: 1.1, 1.5, 2.1, 4.2, 4.3, 6.1, 6.2, 6.3_

- [ ] 10.3 Add frontend services and state management
  - Create AuthService for authentication state and Google OAuth handling
  - Implement CvService for CV upload, processing, and version management
  - Build JobService for job URL processing and analysis
  - Create ApiService with HTTP interceptors for authentication and error handling
  - _Requirements: 5.4, 5.5, 5.6, 5.7_

- [ ] 10.4 Implement user experience enhancements
  - Add loading indicators and progress bars for long-running operations
  - Create error handling with user-friendly messages and retry options
  - Implement rate limiting feedback with countdown timers
  - Add success notifications and confirmation dialogs
  - _Requirements: 9.1, 9.2, 9.3, 9.5_

- [ ] 11. Create comprehensive testing suite
- [ ] 11.1 Write backend API tests
  - Create unit tests for all Express.js routes and services using Jest
  - Implement integration tests with DynamoDB and S3 mocking
  - Write API endpoint tests with proper authentication testing
  - Add Amazon Bedrock integration tests with mock responses
  - _Requirements: All backend functionality_

- [ ] 11.2 Build frontend component tests
  - Create unit tests for Angular components using Jest and Angular Testing Library
  - Implement integration tests for component interactions and routing
  - Write E2E tests using Cypress for complete user workflows
  - Add accessibility tests with axe-core integration
  - _Requirements: All frontend functionality_

- [ ] 11.3 Implement security and performance testing
  - Create authentication and authorization tests for user data isolation
  - Write input validation tests for malicious input handling
  - Implement load tests for CV processing and rate limiting
  - Add file upload security tests with virus scanning simulation
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 11.4 Add Docker and container testing
  - Create Docker container build tests for backend API
  - Implement container security scanning with vulnerability checks
  - Write Docker Compose integration tests for local development
  - Add container performance and resource usage tests
  - _Requirements: App Runner containerized deployment_

- [x] 12. Deploy and configure production environment
- [x] 12.1 Set up AWS App Runner deployment infrastructure
  - Create Terraform configurations for all AWS resources (DynamoDB, S3, IAM, SES)
  - Configure AWS App Runner service for containerized backend API deployment
  - Set up App Runner auto-scaling and health check configurations
  - Create separate App Runner service for Angular frontend with static hosting
  - _Requirements: All requirements need proper deployment_

- [ ] 12.2 Configure container registry and image management
  - Set up Amazon ECR (Elastic Container Registry) for Docker image storage
  - Create automated Docker image builds and pushes to ECR
  - Implement image versioning and tagging strategy
  - Configure App Runner to pull images from ECR with proper IAM permissions
  - _Requirements: App Runner requires container images from ECR_

- [ ] 12.3 Configure monitoring and logging
  - Set up CloudWatch logging for App Runner services
  - Create CloudWatch alarms for error rates, response times, and resource usage
  - Implement application-level logging with structured JSON logs
  - Add user activity monitoring and analytics
  - _Requirements: 9.5, performance monitoring_

- [ ] 12.4 Implement CI/CD pipeline for App Runner
  - Create GitHub Actions workflow for automated testing and Docker builds
  - Set up automated deployment to App Runner on successful builds
  - Implement blue-green deployment strategy using App Runner deployment configurations
  - Add deployment validation, health checks, and automated rollback procedures
  - _Requirements: Deployment reliability and maintenance_

- [x] 12.5 Configure production environment variables and secrets
  - Set up AWS Systems Manager Parameter Store for configuration management
  - Configure App Runner environment variables for database connections and API keys
  - Implement secure secret management for JWT secrets, OAuth credentials, and API keys
  - Add environment-specific configurations for development, staging, and production
  - _Requirements: Secure configuration management for production deployment_