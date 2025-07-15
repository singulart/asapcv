# ASAP CV

AI-powered CV tailoring application that helps job seekers customize their resumes to match specific job descriptions.

## Project Structure

This is a monorepo containing:

- **frontend/**: Angular application for the user interface
- **backend/**: Node.js Lambda functions for serverless backend
- **shared/**: Shared TypeScript types and validation schemas

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies for all workspaces
npm install

# Install dependencies for specific workspace
npm install --workspace=frontend
npm install --workspace=backend
npm install --workspace=shared
```

### Development

```bash
# Start frontend development server
npm run dev:frontend

# Start backend development server
npm run dev:backend

# Build all projects
npm run build:frontend
npm run build:backend

# Run tests
npm run test:frontend
npm run test:backend

# Lint and format code
npm run lint
npm run format
```

## Architecture

- **Frontend**: Angular 16+ with TypeScript
- **Backend**: AWS Lambda functions with Node.js
- **Database**: DynamoDB
- **Storage**: S3 for CV files
- **AI**: Amazon Bedrock for CV analysis and tailoring
- **Authentication**: JWT with Google OAuth support
- **Email**: AWS SES for email-based CV processing

## Features

- CV upload and parsing (PDF, DOC, DOCX)
- Job description analysis from URLs
- AI-powered CV tailoring using Amazon Bedrock
- Multiple CV version management
- Email-based CV processing
- Responsive web interface
- Google OAuth authentication

## Deployment

The application is designed to be deployed on AWS using:
- AWS App Runner for frontend hosting
- AWS Lambda for backend functions
- API Gateway for REST API
- DynamoDB for data storage
- S3 for file storage
- SES for email processing