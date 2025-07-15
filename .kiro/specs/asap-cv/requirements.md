# Requirements Document

## Introduction

ASAP CV is a web application that enables users to customize and tailor their CVs to better match specific job descriptions. The platform helps job seekers optimize their resumes by analyzing job requirements and suggesting relevant modifications to improve their chances of getting interviews. The application operates as a monorepo with an Angular frontend, Node.js backend running on AWS Lambda, DynamoDB for data storage, and deployment via AWS App Runner.

## Requirements

### Requirement 1

**User Story:** As a job seeker, I want to upload my base CV, so that I can use it as a foundation for creating tailored versions.

#### Acceptance Criteria

1. WHEN a user uploads a CV file THEN the system SHALL accept PDF, DOC, and DOCX formats
2. WHEN a CV is uploaded THEN the system SHALL extract and parse the text content
3. WHEN CV parsing is complete THEN the system SHALL store the CV data in the user's profile
4. IF the uploaded file is corrupted or unsupported THEN the system SHALL display an appropriate error message
5. WHEN a CV is successfully uploaded THEN the system SHALL display a confirmation message with parsed sections

### Requirement 2

**User Story:** As a job seeker, I want to provide job posting URLs, so that the system can fetch and analyze job descriptions for tailoring my CV.

#### Acceptance Criteria

1. WHEN a user provides a job posting URL THEN the system SHALL validate the URL format
2. WHEN a valid URL is submitted THEN the system SHALL fetch and extract the job description content from the webpage
3. WHEN job content is extracted THEN the system SHALL parse key skills, requirements, and keywords
4. WHEN job analysis is complete THEN the system SHALL identify matching and missing elements from the user's CV
5. IF URL fetching fails THEN the system SHALL provide a clear error message with troubleshooting suggestions
6. IF the extracted content is insufficient THEN the system SHALL notify the user and suggest trying a different URL
7. WHEN job analysis is complete THEN the system SHALL store the job description and source URL for future reference

### Requirement 3

**User Story:** As a job seeker, I want the system to automatically generate a tailored CV version, so that I can quickly download and use it for job applications.

#### Acceptance Criteria

1. WHEN job description analysis is complete THEN the system SHALL automatically replace the summary section with a new version that matches the job description
2. WHEN generating tailored content THEN the system SHALL create bullet points that align with expected qualifications and responsibilities from the job description
3. WHEN processing past employment sections THEN the system SHALL replace existing bullet points with newly generated ones based on the job requirements
4. WHEN a tailored CV is generated THEN the system SHALL maintain the original formatting and structure
5. WHEN CV generation is complete THEN the system SHALL provide download options in PDF and DOC formats
6. WHEN a tailored CV is created THEN the system SHALL save it to the user's profile with the associated job title
7. IF CV generation fails THEN the system SHALL provide error details and allow retry

### Requirement 4

**User Story:** As a job seeker, I want to manage multiple CV versions, so that I can track and reuse tailored CVs for different job types.

#### Acceptance Criteria

1. WHEN a user accesses their profile THEN the system SHALL display all saved CV versions
2. WHEN viewing CV versions THEN the system SHALL show the associated job title, creation date, and key modifications
3. WHEN a user selects a CV version THEN the system SHALL allow editing, downloading, or deleting
4. WHEN a user wants to create a new version THEN the system SHALL allow using any existing version as a base
5. IF a user tries to delete their base CV THEN the system SHALL prevent deletion and suggest creating a backup

### Requirement 5

**User Story:** As a job seeker, I want to create an account and manage my profile, so that I can securely store and access my CV data.

#### Acceptance Criteria

1. WHEN a new user registers THEN the system SHALL require email, password, and basic profile information
2. WHEN a user chooses Google OAuth signup THEN the system SHALL request consent for email address and full name access
3. WHEN Google OAuth consent is granted THEN the system SHALL create an account using the provided Google credentials
4. WHEN a user logs in THEN the system SHALL authenticate credentials (traditional or OAuth) and provide secure access
5. WHEN a user is authenticated THEN the system SHALL maintain session security throughout their usage
6. WHEN a user updates their profile THEN the system SHALL validate and save changes securely
7. IF authentication fails THEN the system SHALL provide clear error messages and account recovery options

### Requirement 6

**User Story:** As a job seeker, I want to review the tailored CV before downloading, so that I can verify the changes and download it when satisfied.

#### Acceptance Criteria

1. WHEN a tailored CV is generated THEN the system SHALL display a preview of the final version
2. WHEN viewing the CV preview THEN the system SHALL highlight the sections that were modified
3. WHEN reviewing the tailored CV THEN the system SHALL provide a download button to save as PDF
4. WHEN a user downloads the CV THEN the system SHALL generate a high-quality PDF with proper formatting
5. WHEN the CV is downloaded THEN the system SHALL automatically save the version to the user's profile
6. IF the user is not satisfied with the tailored version THEN the system SHALL allow them to try with a different job URL

### Requirement 7

**User Story:** As a job seeker, I want my CV data to be private and secure, so that other users cannot access my personal information.

#### Acceptance Criteria

1. WHEN a user accesses their data THEN the system SHALL only display CVs and profiles belonging to that authenticated user
2. WHEN API requests are made THEN the system SHALL validate user authorization before returning any data
3. WHEN storing user data THEN the system SHALL implement proper data isolation using user-specific access controls
4. WHEN a user attempts to access unauthorized data THEN the system SHALL deny access and log the attempt
5. WHEN user sessions expire THEN the system SHALL require re-authentication before accessing any personal data
6. IF unauthorized access is detected THEN the system SHALL immediately terminate the session and notify security monitoring

### Requirement 8

**User Story:** As a job seeker, I want to send job URLs via email for automatic CV tailoring, so that I can get tailored CVs without using the web interface.

#### Acceptance Criteria

1. WHEN a user sends an email to asapcv@argorand.io THEN the system SHALL verify the sender's email matches a registered user account
2. WHEN the sender is verified THEN the system SHALL extract job description URLs from the email content
3. WHEN a valid job URL is found THEN the system SHALL automatically perform CV tailoring using the user's base CV
4. WHEN CV tailoring is complete THEN the system SHALL send the tailored CV as a PDF attachment via email response
5. WHEN processing is complete THEN the system SHALL save the tailored CV version to the user's profile
6. IF the sender email doesn't match a registered account THEN the system SHALL send an error response with signup instructions
7. IF no valid job URL is found in the email THEN the system SHALL send a response with format instructions

### Requirement 9

**User Story:** As a job seeker, I want the application to be responsive and fast, so that I can efficiently work on my CV tailoring.

#### Acceptance Criteria

1. WHEN a user accesses the application THEN the system SHALL load the main interface within 3 seconds
2. WHEN CV processing occurs THEN the system SHALL complete analysis within 30 seconds
3. WHEN users interact with the interface THEN the system SHALL respond to actions within 1 second
4. WHEN the application is accessed on mobile devices THEN the system SHALL provide a fully functional responsive interface
5. IF processing takes longer than expected THEN the system SHALL display progress indicators and estimated completion time