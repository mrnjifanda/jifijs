# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-12-31

### Added

#### Authentication & Security
- JWT authentication with refresh tokens and automatic expiration
- Role-based access control (user/admin)
- OTP verification for account activation
- Password reset workflow with email templates
- Security alerts for suspicious login activity
- IP tracking and device fingerprinting
- Session management with Redis caching
- Login history with 90-day auto-cleanup using MongoDB TTL indexes

#### Admin Dashboard APIs
- User management with role assignment
- Activity logging and system analytics
- Real-time statistics and monitoring
- API key management for third-party integrations
- Log analysis with retention policies
- Upload file statistics and management

#### File Upload System
- Secure file upload with comprehensive validation
- File type filtering (images, documents, videos, audio, archives)
- Configurable size limits (default: 10MB per file, max 10 files)
- Metadata support for file categorization
- File tracking with UUID identification
- Soft delete functionality
- Upload statistics and analytics

#### Performance & Caching
- Redis caching layer with automatic TTL management
- In-memory fallback when Redis is unavailable
- Cache-aside pattern for optimized database queries
- Automatic cache invalidation on data updates
- findByIdCached() method for efficient queries
- Comprehensive cache hit/miss statistics
- Authentication caching for sub-millisecond response times

#### Security Features
- Configurable rate limiting per route with Redis backend
- API key authentication for external services
- Request logging and comprehensive auditing
- Security event notifications via email
- Helmet.js for HTTP header security
- CORS configuration with origin whitelisting
- XSS and SQL injection protection
- File upload security with type validation

#### Developer Experience
- Full TypeScript support with strict mode enabled
- CLI code generator for rapid resource creation
- OpenAPI 3.1.0 documentation with Swagger UI
- Modular MVC architecture for maintainability
- Joi validation schemas for all inputs
- Handlebars templating engine for emails
- Bull Queue for background job processing
- Winston logging with file rotation
- Jest testing framework configured
- Hot reload in development mode

#### Email System
- Template-based emails using Handlebars
- Queue-based asynchronous email sending
- Support for file attachments
- Multi-layout support for different email types
- Beautiful pre-built HTML templates

### Dependencies
- Express 5.1.0
- TypeScript 5.4.5
- MongoDB/Mongoose 7.0.5
- Redis/IORedis 5.7.0
- JWT (jsonwebtoken 9.0.0)
- Bull 4.12.2 (queue management)
- Winston 3.17.0 (logging)
- Joi 17.9.2 (validation)
- Helmet 8.1.0 (security)

[0.1.0]: https://github.com/mrnjifanda/jifijs/releases/tag/v0.1.0
