# Security Policy

## Supported Versions

We take security seriously and provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We appreciate your efforts to responsibly disclose your findings and will make every effort to acknowledge your contributions.

### How to Report a Security Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to:
- **Email**: [jifijs@njifanda.com](mailto:jifijs@njifanda.com)
- **Subject**: "SECURITY: [Brief Description]"

### What to Include in Your Report

To help us better understand and resolve the issue, please include:

1. **Type of issue** (e.g., SQL injection, XSS, CSRF, etc.)
2. **Full paths** of source file(s) related to the manifestation of the issue
3. **Location** of the affected source code (tag/branch/commit or direct URL)
4. **Step-by-step instructions** to reproduce the issue
5. **Proof-of-concept or exploit code** (if possible)
6. **Impact** of the issue, including how an attacker might exploit it
7. **Any potential solutions** you might have identified

### What to Expect

- **Initial Response**: Within 48 hours of your report
- **Assessment**: We'll assess the vulnerability and determine its severity
- **Fix Timeline**: Critical issues will be addressed within 7 days
- **Disclosure**: We'll coordinate with you on the disclosure timeline
- **Credit**: We'll acknowledge your contribution in the security advisory (unless you prefer to remain anonymous)

## Security Best Practices

When using JifiJs in production, follow these security best practices:

### 1. Environment Variables

- Never commit `.env` files to version control
- Use strong, randomly generated secrets for:
  - `JWT_SECRET`
  - `JWT_REFRESH_SECRET`
  - `COOKIE_SECRET`
- Rotate secrets regularly
- Use different secrets for each environment

### 2. Database Security

- Use MongoDB authentication
- Restrict MongoDB network access
- Enable MongoDB encryption at rest
- Use connection string with authentication:
  ```
  MONGODB_URI=mongodb://user:password@host:port/database
  ```

### 3. Redis Security

- Use Redis authentication (`requirepass`)
- Restrict Redis network access
- Use Redis over TLS in production:
  ```
  REDIS_URL=rediss://user:password@host:port
  ```

### 4. API Security

- Enable rate limiting for all endpoints
- Use API keys for external services
- Implement proper CORS configuration
- Validate all user inputs
- Sanitize data before database operations

### 5. Authentication

- Use strong password policies
- Implement account lockout after failed attempts
- Enable OTP verification for sensitive operations
- Set appropriate JWT expiration times
- Invalidate tokens on logout

### 6. File Upload

- Validate file types and sizes
- Scan uploaded files for malware
- Store files outside web root
- Use random filenames
- Implement upload limits

### 7. HTTPS/TLS

- Always use HTTPS in production
- Redirect HTTP to HTTPS
- Use strong TLS configurations
- Keep SSL certificates up to date
- Consider implementing HSTS

### 8. Dependencies

- Regularly update dependencies:
  ```bash
  npm audit
  npm audit fix
  ```
- Review dependency security advisories
- Use tools like Snyk or Dependabot
- Pin critical dependencies

### 9. Logging and Monitoring

- Enable comprehensive logging
- Monitor for suspicious activities
- Set up alerts for security events
- Regularly review logs
- Protect log files from unauthorized access

### 10. Code Security

- Follow OWASP Top 10 guidelines
- Use parameterized queries (Mongoose does this by default)
- Escape user input in templates
- Implement CSP headers
- Enable security middleware (Helmet.js is included)

## Security Features in JifiJs

JifiJs includes several built-in security features:

### Authentication & Authorization

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Session management with Redis
- Token blacklisting on logout
- IP tracking and device fingerprinting

### Protection Mechanisms

- **Helmet.js**: HTTP security headers
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Redis-backed rate limiting per route
- **Input Validation**: Joi schemas for all inputs
- **XSS Protection**: Enabled via Helmet
- **SQL Injection**: Protected via Mongoose ODM

### Monitoring & Auditing

- Request logging with Morgan
- Activity logging for admin actions
- Login history tracking
- Security alerts via email
- Failed login attempt monitoring

## Known Security Considerations

### Redis Connection

When Redis is unavailable, the system falls back to in-memory caching. While functional, this means:
- Cache is not shared across instances
- Cache is lost on restart
- Less suitable for distributed systems

**Recommendation**: Always use Redis in production.

### File Upload

The current implementation allows various file types. In production:
- Restrict allowed MIME types to your needs
- Implement virus scanning
- Use dedicated storage services (S3, etc.)

### Rate Limiting

Default rate limits may need adjustment based on your use case:
- API endpoints: 100 requests per 15 minutes
- Login endpoint: 5 attempts per 15 minutes

Adjust in `configs/ratelimit.config.ts`.

## Incident Response

If a security incident occurs:

1. **Contain**: Immediately isolate affected systems
2. **Assess**: Determine the scope and impact
3. **Notify**: Inform affected users if necessary
4. **Remediate**: Deploy fixes
5. **Document**: Record incident details and lessons learned

## Security Updates

- Security updates are released as patch versions
- Critical vulnerabilities receive immediate patches
- Subscribe to GitHub releases for notifications
- Monitor [CHANGELOG.md](CHANGELOG.md) for security fixes

## Contact

For security concerns, contact:
- Email: [jifijs@njifanda.com](mailto:jifijs@njifanda.com)
- GitHub Security Advisory: [Create Advisory](https://github.com/mrnjifanda/jifijs/security/advisories/new)

## Acknowledgments

We thank the security researchers and contributors who help keep JifiJs secure.

---

**Last Updated**: 2025-12-31
