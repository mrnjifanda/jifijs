# JifiJs

[![GitHub stars](https://img.shields.io/github/stars/mrnjifanda/jifijs.svg)](https://github.com/mrnjifanda/jifijs/stargazers) [![GitHub license](https://img.shields.io/github/license/mrnjifanda/jifijs.svg)](https://raw.githubusercontent.com/mrnjifanda/jifijs/main/LICENSE.txt) [![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/) [![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)

> Production-ready Express.js + TypeScript API framework featuring enterprise-grade authentication, Redis caching, automatic code generation, and comprehensive admin capabilities. Built for developers who value speed and quality.

## Documentation

[Read the full documentation](https://jifijs.njifanda.com)

## Features

### Authentication & Security

- JWT authentication with refresh tokens and automatic expiration
- Role-based access control (user/admin)
- OTP verification for account activation
- Password reset workflow with email templates
- Security alerts for suspicious login activity
- IP tracking and device fingerprinting
- Session management with Redis caching
- Login history with 90-day auto-cleanup using MongoDB TTL indexes

### Admin Dashboard APIs

- User management with role assignment
- Activity logging and system analytics
- Real-time statistics and monitoring
- API key management for third-party integrations
- Log analysis with retention policies
- Upload file statistics and management

### File Upload System

- Secure file upload with comprehensive validation
- File type filtering (images, documents, videos, audio, archives)
- Configurable size limits (default: 10MB per file, max 10 files)
- Metadata support for file categorization
- File tracking with UUID identification
- Soft delete functionality
- Upload statistics and analytics

### Performance & Caching

- Redis caching layer with automatic TTL management
- In-memory fallback when Redis is unavailable
- Cache-aside pattern for optimized database queries
- Automatic cache invalidation on data updates
- findByIdCached() method for efficient queries
- Comprehensive cache hit/miss statistics
- Authentication caching for sub-millisecond response times

### Security

- Configurable rate limiting per route with Redis backend
- API key authentication for external services
- Request logging and comprehensive auditing
- Security event notifications via email
- Helmet.js for HTTP header security
- CORS configuration with origin whitelisting
- XSS and SQL injection protection
- File upload security with type validation

### Developer Experience

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

### Email System

- Template-based emails using Handlebars
- Queue-based asynchronous email sending
- Support for file attachments
- Multi-layout support for different email types
- Beautiful pre-built HTML templates

## Quick Start

### Prerequisites

Ensure you have the following installed:

| Requirement | Version | Description |
|------------|---------|-------------|
| Node.js      | >= 18.x     | JavaScript runtime environment |
| NPM          | >= 9.x      | Package manager |
| MongoDB      | >= 5.0      | NoSQL database (local or MongoDB Atlas) |
| Redis        | >= 6.x      | In-memory data store for caching and queues |
| TypeScript   | >= 5.x      | Type checking and compilation |

### Installation

There are two ways to get started with JifiJs:

#### Option 1: Using npx (Recommended for new projects)

Create a new project instantly with a single command:

```bash
# Create a new project
npx create-jifijs my-project

# Navigate to project
cd my-project

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

#### Option 2: Clone from GitHub (For contributors)

Clone the repository directly:

```bash
# Clone repository
git clone https://github.com/mrnjifanda/jifijs.git my-project
cd my-project

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

#### Quick Start Commands

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run test suite
npm test

# Generate code
npm run g resource product
```

Server will be available at `http://localhost:3000` (or your configured PORT)

## Project Structure

```plaintext
jifijs/
├── bin/                      # CLI tools and code generators
│   ├── cli                   # Main CLI entry point
│   ├── templates.js          # Code generation templates
│   ├── README.md            # Generator documentation
│   └── script/              # Generation scripts
├── configs/                  # Application configuration
│   ├── app.config.ts        # Core app settings
│   ├── database.config.ts   # MongoDB connection
│   ├── redis.config.ts      # Redis configuration
│   ├── ratelimit.config.ts  # Rate limiting rules
│   └── response.config.ts   # Response formatting
├── docs/                     # API documentation
│   ├── routes/              # Route documentation files
│   ├── build.ts             # OpenAPI builder
│   └── swagger.ts           # Swagger UI configuration
├── public/                   # Static files
│   └── upload/              # User uploaded files
├── routes/                   # Route definitions
│   ├── admin/               # Admin API routes
│   ├── app/                 # Application routes
│   └── auth.route.ts        # Authentication routes
├── src/
│   ├── controllers/         # HTTP request handlers
│   │   ├── admin/           # Admin controllers
│   │   ├── app/             # Application controllers
│   │   └── auth.controller.ts
│   ├── models/              # Mongoose database models
│   │   └── auth/            # Authentication models
│   ├── services/            # Business logic layer
│   │   ├── admin/           # Admin services
│   │   ├── app/             # Application services
│   │   └── auth/            # Authentication services
│   └── types/               # TypeScript type definitions
│       ├── auth.types.ts
│       ├── upload.types.ts
│       └── service.types.ts
├── templates/               # Email templates (Handlebars)
│   └── auth/                # Authentication email templates
├── tests/                   # Test suites
│   └── **/*.test.ts
├── utils/                   # Helper functions and utilities
│   ├── bases/               # Base classes
│   │   ├── base.controller.ts
│   │   ├── base.service.ts
│   │   ├── mail.service.ts
│   │   └── queues/
│   ├── helpers/             # Utility functions
│   │   ├── logger.helper.ts
│   │   ├── storage.helper.ts
│   │   └── shutdown.helper.ts
│   ├── interceptors/        # Request/Response interceptors
│   ├── middlewares/         # Express middlewares
│   │   ├── app.middleware.ts
│   │   └── auth/
│   ├── seeders/             # Database seeding
│   └── validations/         # Joi validation schemas
├── main.ts                  # Application entry point
├── routes.ts                # Routes registration
└── tsconfig.json            # TypeScript configuration
```

## CLI Code Generator

JifiJs includes a powerful code generator to accelerate development:

### Quick Start

```bash
# Generate a complete resource (recommended)
npm run g resource product

# Generate specific components
npm run g controller product
npm run g service product
npm run g model product
npm run g route product
npm run g validation product
npm run g type product
```

### Available Commands

| Shortcut | Type | Description |
|----------|------|-------------|
| `t` | type | Generate TypeScript interfaces and types |
| `c` | controller | Generate controller with CRUD methods |
| `s` | service | Generate service with business logic |
| `m` | model | Generate Mongoose model |
| `r` | route | Generate REST API routes |
| `v` | validation | Generate Joi validation schemas |
| - | resource | Generate all of the above |
| - | all | Alias for resource |

### Folder Options

Specify destination folder with `--folder` or `-f`:

```bash
# Generate in app folder (default)
npm run g resource product

# Generate in admin folder
npm run g resource category --folder admin

# Generate in auth folder
npm run g controller user -f auth
```

Available folders: `app`, `admin`, `auth`

### Generated Output

Running `npm run g resource product` creates:

```
✓ src/types/product.types.ts          # TypeScript interfaces
✓ src/models/product.model.ts         # Mongoose model
✓ src/services/app/product.service.ts # Service layer
✓ src/controllers/app/product.controller.ts # Controller
✓ routes/app/product.route.ts         # REST routes
✓ utils/validations/product.validation.ts # Joi validation
```

### Generated Code Features

- Complete CRUD operations (index, show, store, update, destroy)
- Full TypeScript type safety
- Singleton pattern implementation
- Joi validation schemas
- RESTful routes (GET, POST, PUT, DELETE)
- Follows project conventions

For detailed documentation, see [bin/README.md](bin/README.md)

## File Upload API

Secure file management with validation and tracking.

### Endpoints

```bash
POST   /file/upload        # Upload single file
POST   /file/upload-multi  # Upload multiple files
GET    /file/info          # Get file information
GET    /file/stats         # Get upload statistics
DELETE /file/delete        # Delete file (soft delete)
```

### Features

- Size limit: 10MB per file
- File count limit: Maximum 10 files per request
- Allowed types:
  - Images: JPEG, PNG, GIF, WebP, SVG
  - Documents: PDF, Word, Excel, PowerPoint, TXT, CSV
  - Media: MP4, MPEG, MOV, MP3, WAV
  - Archives: ZIP, RAR
- Metadata support: Attach custom JSON metadata
- Tracking: UUID-based file identification
- Statistics: File count, size, MIME type analytics

### Usage Example

```bash
# Upload single file
curl -X POST http://localhost:3000/file/upload \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@image.jpg" \
  -F 'metadata={"description": "Profile picture"}'

# Upload multiple files
curl -X POST http://localhost:3000/file/upload-multi \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@doc1.pdf" \
  -F "files=@doc2.pdf"

# Get file info
curl -X GET "http://localhost:3000/file/info?id=FILE_UUID" \
  -H "x-api-key: YOUR_API_KEY"
```

## API Endpoints

### Authentication

```
POST   /auth/register           # Register new user
POST   /auth/login              # Login
POST   /auth/logout             # Logout
POST   /auth/refresh            # Refresh access token
POST   /auth/verify-otp         # Verify OTP code
POST   /auth/resend-otp         # Resend OTP
POST   /auth/forgot-password    # Request password reset
POST   /auth/reset-password     # Reset password with token
GET    /auth/profile            # Get user profile
PUT    /auth/profile            # Update user profile
```

### User Endpoints

```
GET    /user                    # Get current user information
PUT    /user                    # Update user information
DELETE /user                    # Delete account
```

### Admin - User Management

```
GET    /admin/users             # List all users
GET    /admin/users/:id         # Get user by ID
PUT    /admin/users/:id         # Update user
DELETE /admin/users/:id         # Delete user
PUT    /admin/users/:id/role    # Update user role
```

### Admin - Logs

```
GET    /admin/logs              # Get all logs
GET    /admin/logs/stats        # Log statistics
POST   /admin/logs/analyze      # Analyze logs
DELETE /admin/logs/cleanup      # Clean old logs
```

### Admin - API Keys

```
GET    /admin/x-api-key         # List API keys
POST   /admin/x-api-key         # Create API key
PUT    /admin/x-api-key/:id     # Update API key
DELETE /admin/x-api-key/:id     # Delete API key
```

## Performance Features

### Redis Caching System

JifiJs includes a sophisticated caching layer using Redis with in-memory fallback for improved performance.

#### Key Features

- Automatic TTL: Cache entries expire automatically
- Memory Fallback: Works when Redis is unavailable
- Cache-Aside Pattern: Fetch from cache or database
- Cache Invalidation: Automatic and manual clearing
- Statistics: Track hit/miss rates

#### Usage in Services

All services extending `BaseService` have access to caching methods:

```typescript
// Cache a value
await service.cacheSet('user:123', userData, 3600); // 1 hour TTL

// Get from cache
const user = await service.cacheGet('user:123');

// Get or fetch (cache-aside pattern)
const user = await service.cacheGetOrSet(
  'user:123',
  async () => await User.findById('123'),
  3600
);

// Find by ID with automatic caching
const result = await service.findByIdCached('123', {}, null, 3600);

// Invalidate specific cache entry
await service.invalidateCache('123');

// Invalidate all cache for this model
await service.invalidateAllCache();

// Delete by pattern
await service.cacheDeletePattern('user:*');
```

#### Authentication Caching

The login system automatically caches user authentication data for ultra-fast subsequent requests:

**Performance Impact:**

| Operation | Without Cache | With Cache | Improvement |
|-----------|---------------|------------|-------------|
| Authentication check | ~50-100ms | &lt; 1ms | 50-100x faster |
| API requests with auth | DB query each time | Cache hit | Massive DB load reduction |

**Cache Flow:**

1. User logs in → User data cached for 1 hour
2. Subsequent requests → Middleware checks cache (< 1ms)
3. User logs out → Cache invalidated
4. Password reset → Cache invalidated, all sessions logged out

### Login History with TTL

Login history is stored in a separate collection with automatic cleanup after 90 days using MongoDB TTL indexes.

#### Benefits

- Improved Performance: Auth documents remain small
- Scalability: No array size limits
- Automatic Cleanup: Old records auto-delete after 90 days
- Better Queries: Indexed for efficient lookups

#### Features

```typescript
import loginHistoryService from './src/services/auth/login-history.service';

// Create login history (automatic on login)
await loginHistoryService.createLoginHistory({
  auth: authId,
  user: userId,
  ip: '192.168.1.1',
  token: accessToken,
  refresh_token: refreshToken,
  devices: {
    browser: { name: 'Chrome', version: '143.0.0.0', major: '143' },
    os: { name: 'Windows', version: '10.0' }
  },
  locations: { country: 'US', city: 'New York' }
});

// Get user's login history
const history = await loginHistoryService.getByUser(userId, 10);

// Logout from all devices
await loginHistoryService.deleteAllByUser(userId);

// Get login statistics
const stats = await loginHistoryService.getLoginStats(userId);
```

## Environment Variables

Configure your application in `.env`:

```bash
# Application
PORT=3000
NODE_ENV=development
APP_NAME="JifiJs"
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/jifijs
MONGODB_USER=
MONGODB_PASSWORD=

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES=24h
JWT_REFRESH_EXPIRES=7d
OTP_EXPIRES=10m

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_URL=redis://localhost:6379

# Rate Limiting
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX_REQUESTS=100

# Email (SMTP)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@example.com
SMTP_FROM_NAME="JifiJs"

# File Upload
MAX_FILE_SIZE=10485760        # 10MB in bytes
MAX_FILES_COUNT=10
UPLOAD_PATH=./public/upload

# Logging
LOG_LEVEL=info
LOG_FILE_SIZE=10485760        # 10MB
LOG_RETENTION_DAYS=30

# Security
API_KEY_HEADER=x-api-key
BCRYPT_ROUNDS=10
```

## Available Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build:watch      # Build and watch for changes

# Building
npm run build            # Build TypeScript to JavaScript
npm start                # Run production build

# Code Generation
npm run g                # Run code generator

# Testing
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
npm run test:verbose     # Run tests with verbose output

# Documentation
npm run docs:build       # Build OpenAPI documentation
npm run docs:watch       # Watch and rebuild docs

# Code Quality
npm run type-check       # TypeScript type checking
npm run lint             # Lint code with ESLint

# Email Development
npm run start:maildev    # Start MailDev for email testing
```

## Testing

JifiJs uses Jest for comprehensive testing:

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Verbose output
npm run test:verbose
```

Test files should be placed in the `tests/` directory with the `.test.ts` extension.

## Documentation

### API Documentation

- **Swagger UI**: Available at `/docs` when running the server
- **OpenAPI Spec**: Auto-generated from route documentation
- **Build docs**: `npm run docs:build`
- **Watch mode**: `npm run docs:watch`

### Email Testing

Use MailDev for local email testing:

```bash
npm run start:maildev
```

Access MailDev UI at `http://localhost:1080`

## Architecture

### MVC Pattern

JifiJs follows a clean MVC architecture:

- **Models**: Define data structure and database schema
- **Services**: Business logic and data manipulation
- **Controllers**: Handle HTTP requests/responses
- **Routes**: Define API endpoints
- **Validations**: Validate incoming requests

### Base Classes

All services and controllers extend base classes:

```typescript
// Services extend BaseService
class ProductService extends BaseService<IProduct> {
  // Inherits: find, findById, create, update, delete
  // Add custom methods here
}

// Controllers extend BaseController
class ProductController extends BaseController {
  // Inherits: index, show, store, update, destroy
  // Add custom methods here
}
```

### Singleton Pattern

Services and controllers use the singleton pattern for optimal memory usage.

## Security Best Practices

1. **API Keys**: Always use API keys for external requests
2. **JWT Tokens**: Implement token refresh mechanism
3. **Rate Limiting**: Configure appropriate limits per route
4. **Input Validation**: Use Joi schemas for all inputs
5. **File Upload**: Validate file types and sizes
6. **Environment Variables**: Never commit `.env` files
7. **HTTPS**: Use HTTPS in production
8. **CORS**: Configure CORS for your frontend domain

## Deployment

### Build for Production

```bash
# Install dependencies
npm install --production

# Build TypeScript
npm run build

# Start server
npm start
```

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure MongoDB connection
3. Set up Redis instance
4. Configure SMTP for emails
5. Set strong JWT secrets
6. Configure rate limiting

### Docker (Optional)

```bash
# Build image
docker build -t jifijs .

# Run container
docker run -p 3000:3000 --env-file .env jifijs
```

## Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes:
   - Follow TypeScript best practices
   - Add tests for new features
   - Update documentation
   - Follow existing code style
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

For major changes, please open an issue first to discuss what you would like to change.

## Roadmap

- [ ] WebSocket support for real-time features
- [ ] GraphQL API option
- [ ] Microservices architecture example
- [ ] Docker Compose setup
- [ ] CI/CD pipeline templates
- [ ] More authentication methods (OAuth, SAML)
- [ ] API versioning
- [ ] Multi-tenancy support

## Known Issues

See the [issues page](https://github.com/mrnjifanda/jifijs/issues) for known bugs and feature requests.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history.

## License

This project is licensed under the OSL-3.0 License - see the [LICENSE.txt](LICENSE.txt) file for details.

## Author

**Mr NJIFANDA**

- Website: [jifijs.njifanda.com](https://jifijs.njifanda.com)
- Email: [jifijs@njifanda.com](mailto:jifijs@njifanda.com)
- GitHub: [@mrnjifanda](https://github.com/mrnjifanda)

## Support

Give a ⭐️ if this project helped you!

## Contact

For questions or support:

- Email: jifijs@njifanda.com
- Documentation: [https://jifijs.njifanda.com](https://jifijs.njifanda.com)
- GitHub: [https://github.com/mrnjifanda/jifijs](https://github.com/mrnjifanda/jifijs)

---

**Built with ❤️ by Mr NJIFANDA**
