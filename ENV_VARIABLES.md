# Environment Variables Documentation

## Complete Reference for TMSM Deployment

This document lists all environment variables used by the TMSM application and their requirements.

---

## Critical Variables (Required in Production)

### NODE_ENV
- **Type**: String
- **Required**: Yes
- **Allowed Values**: `development`, `production`, `staging`, `test`
- **Default**: (none - must be set)
- **Description**: Controls application behavior and security settings
- **Example**: `NODE_ENV=production`

### PORT
- **Type**: Number
- **Required**: No
- **Default**: `4000`
- **Description**: Server port number
- **Constraints**: 
  - Must be between 1024-65535
  - Use 4000 for consistency across all environments
- **Example**: `PORT=4000`

### DATABASE_URL
- **Type**: String (PostgreSQL connection string)
- **Required**: Yes
- **Format**: `postgresql://username:password@host:port/database`
- **SSL**: Include `?sslmode=require` for production
- **Default**: (none - must be set in production)
- **Description**: PostgreSQL database connection
- **Examples**:
  ```
  # Local development
  postgresql://postgres:postgres@localhost:5432/tmsm

  # Docker
  postgresql://postgres:postgres@postgres:5432/tmsm

  # AWS RDS (with SSL)
  postgresql://user:password@db.c9akciq32.us-east-1.rds.amazonaws.com:5432/tmsm?sslmode=require

  # Render
  postgresql://user:password@dpg-xyz.render.com:5432/tmsm
  ```

### JWT_SECRET
- **Type**: String (64-byte hex)
- **Required**: Yes
- **Minimum Length**: 64 characters
- **Default**: (none - must be set in production)
- **Description**: Secret key for signing JWT access tokens
- **Generation**: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- **Example**: `7f8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f`
- **Security**: Never commit to version control, use Secrets Manager

### JWT_REFRESH_SECRET
- **Type**: String (64-byte hex)
- **Required**: Yes
- **Minimum Length**: 64 characters
- **Default**: (none - must be set in production)
- **Description**: Secret key for signing JWT refresh tokens
- **Generation**: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- **Example**: `a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0`
- **Security**: Must be different from JWT_SECRET

### SESSION_SECRET
- **Type**: String (random token)
- **Required**: Yes
- **Minimum Length**: 32 characters
- **Default**: (none - must be set in production)
- **Description**: Secret for session authentication
- **Generation**: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- **Example**: `9z8y7x6w5v4u3t2s1r0q9p8o7n6m5l4k3j2i1h0g9f8e7d6c5b4a3z2y1x0w`

### FRONTEND_URL
- **Type**: String (URL)
- **Required**: Yes
- **Format**: Must be valid HTTPS URL (in production)
- **Default**: (none - must be set)
- **Description**: Frontend application URL for CORS and redirects
- **Examples**:
  ```
  # Development
  http://localhost:5173

  # Production
  https://tmsm-app.com
  https://tmsm-app.onrender.com
  ```
- **Production Requirement**: Must be HTTPS

### CORS_ORIGIN
- **Type**: String (URL)
- **Required**: No
- **Default**: Uses FRONTEND_URL if not set
- **Description**: Allowed origin for CORS requests
- **Note**: Usually same as FRONTEND_URL

---

## Application Configuration

### LOG_LEVEL
- **Type**: String
- **Allowed Values**: `error`, `warn`, `info`, `debug`
- **Default**: `info`
- **Development**: Use `debug` for verbose logging
- **Production**: Use `info` to reduce log volume

### API_PREFIX
- **Type**: String
- **Default**: `/api/v1`
- **Description**: API route prefix
- **Do Not Change**: Keep as `/api/v1`

### API_VERSION
- **Type**: String
- **Default**: `1.0.0`
- **Description**: API version number
- **Format**: Follow semantic versioning

---

## Database Configuration

### DB_POOL_MAX
- **Type**: Number
- **Default**: `10`
- **Development**: 5-10 connections
- **Production**: 15-30 connections (depends on traffic)
- **Description**: Maximum database connection pool size

### DB_SSL
- **Type**: Boolean
- **Default**: `false`
- **Production**: `true` (recommended)
- **Description**: Force SSL for database connections
- **Note**: Set to `true` for RDS and production databases

---

## JWT Token Configuration

### JWT_EXPIRES_IN
- **Type**: String (time format)
- **Default**: `1h` (production) / `7d` (development)
- **Format**: `1h`, `30m`, `7d`, etc.
- **Description**: How long access tokens are valid
- **Security**: Keep short (1h recommended)

### JWT_REFRESH_EXPIRES_IN
- **Type**: String (time format)
- **Default**: `7d`
- **Format**: `7d`, `30d`, etc.
- **Description**: How long refresh tokens are valid
- **Security**: Keep reasonable (7-30 days)

---

## Rate Limiting Configuration

### RATE_LIMIT_WINDOW_MS
- **Type**: Number (milliseconds)
- **Default**: `900000` (15 minutes)
- **Description**: Time window for rate limit counting
- **Example**: 
  - `900000` = 15 minutes
  - `60000` = 1 minute

### RATE_LIMIT_MAX_REQUESTS
- **Type**: Number
- **Default**: `10000`
- **Development**: `100000` (relaxed)
- **Production**: `10000` (strict)
- **Description**: Max requests per window per IP

---

## Redis Configuration (Optional)

### REDIS_URL
- **Type**: String (Redis connection string)
- **Required**: No
- **Format**: `redis://:password@host:port`
- **Examples**:
  ```
  # Local
  redis://localhost:6379

  # Docker
  redis://redis:6379

  # Render
  redis://default:password@redis-xyz.render.com:6379

  # AWS ElastiCache
  redis://default:password@cache.abc123.ng.0001.use1.cache.amazonaws.com:6379
  ```
- **Purpose**: Caching, sessions, real-time features
- **If Not Set**: Application will run without Redis (some features disabled)

---

## Email Configuration (Optional)

### SMTP_HOST
- **Type**: String
- **Description**: SMTP server hostname
- **Examples**: `smtp.sendgrid.net`, `email-smtp.us-east-1.amazonaws.com`

### SMTP_PORT
- **Type**: Number
- **Default**: `587`
- **Common Values**: `587` (TLS), `465` (SSL), `25` (plain)

### SMTP_USER
- **Type**: String
- **Description**: SMTP authentication username

### SMTP_PASS
- **Type**: String
- **Description**: SMTP authentication password or API key

### SMTP_FROM
- **Type**: String (email address)
- **Description**: Default "from" address for emails
- **Example**: `noreply@tmsm-app.com`

### SMTP_SECURE
- **Type**: Boolean
- **Default**: `false` (uses STARTTLS)
- **Set to**: `true` for port 465 (implicit SSL)

---

## File Upload Configuration

### MAX_FILE_SIZE
- **Type**: Number (bytes)
- **Default**: `52428800` (50MB)
- **Examples**:
  - `5242880` = 5MB
  - `52428800` = 50MB
  - `104857600` = 100MB

### UPLOAD_DIR
- **Type**: String (directory path)
- **Default**: `/uploads`
- **Docker**: `/app/uploads`
- **Description**: Directory for storing uploaded files

---

## AWS Configuration (Optional)

### AWS_REGION
- **Type**: String
- **Default**: `us-east-1`
- **Description**: AWS region for services
- **Examples**: `us-east-1`, `eu-west-1`, `ap-south-1`

### AWS_S3_BUCKET
- **Type**: String
- **Description**: S3 bucket name for file storage
- **Example**: `tmsm-uploads-prod`

### AWS_S3_REGION
- **Type**: String
- **Default**: Same as AWS_REGION
- **Description**: Region for S3 bucket

### AWS_S3_ACL
- **Type**: String
- **Default**: `private`
- **Allowed**: `private`, `public-read`, `public-read-write`
- **Production**: Keep as `private`

### AWS_ACCESS_KEY_ID
- **Type**: String
- **Security**: Use IAM role in Elastic Beanstalk, not needed in most cases

### AWS_SECRET_ACCESS_KEY
- **Type**: String
- **Security**: Never commit, use Secrets Manager

---

## Development-Only Variables

These should NOT be set in production.

### DEBUG
- **Type**: Boolean
- **Default**: `false`
- **Purpose**: Enable debug mode
- **Development Only**: Set in .env.docker

### SEED_ADMIN
- **Type**: Boolean
- **Default**: `false`
- **Purpose**: Auto-seed admin account on startup
- **Development Only**: Set in .env.docker

### ADMIN_PASSWORD
- **Type**: String
- **Default**: `Admin@1234`
- **Purpose**: Password for auto-seeded admin account
- **Development Only**: Only used if SEED_ADMIN=true

### ALLOW_CORS_LOCALHOST
- **Type**: Boolean
- **Default**: `false`
- **Purpose**: Allow localhost CORS in production (for testing)
- **Development Only**: Never set in production

---

## Quick Setup Templates

### Development (Local)
```bash
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tmsm
JWT_SECRET=dev_secret_jwt_key_1234567890abcdefghij1234567890abcdefghij
JWT_REFRESH_SECRET=dev_refresh_secret_1234567890abcdefghij1234567890
SESSION_SECRET=dev_session_secret_1234567890abcdefghij
FRONTEND_URL=http://localhost:5173
LOG_LEVEL=debug
REDIS_URL=redis://localhost:6379
SEED_ADMIN=true
```

### Docker Development
```bash
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/tmsm
JWT_SECRET=dev_secret_jwt_key_1234567890abcdefghij1234567890abcdefghij
JWT_REFRESH_SECRET=dev_refresh_secret_1234567890abcdefghij1234567890
SESSION_SECRET=dev_session_secret_1234567890abcdefghij
FRONTEND_URL=http://localhost:5173
LOG_LEVEL=debug
REDIS_URL=redis://redis:6379
SEED_ADMIN=true
```

### Production (Render)
```bash
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://user:pass@dpg-xyz.render.com:5432/tmsm
JWT_SECRET=[64-byte hex generated secret]
JWT_REFRESH_SECRET=[64-byte hex generated secret]
SESSION_SECRET=[64-byte hex generated secret]
FRONTEND_URL=https://your-domain.com
LOG_LEVEL=info
REDIS_URL=redis://default:pass@redis-xyz.render.com:6379
```

### Production (AWS Elastic Beanstalk)
```bash
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://user:pass@db.rds.amazonaws.com:5432/tmsm?sslmode=require
JWT_SECRET=[64-byte hex generated secret]
JWT_REFRESH_SECRET=[64-byte hex generated secret]
SESSION_SECRET=[64-byte hex generated secret]
FRONTEND_URL=https://your-domain.com
LOG_LEVEL=info
REDIS_URL=redis://default:pass@cache.elasticache.amazonaws.com:6379
AWS_S3_BUCKET=tmsm-uploads-prod
```

---

## Validation

Run environment validation:
```bash
npm run validate-env
```

This checks that:
- All critical variables are set
- Secrets are strong enough (64+ characters)
- No placeholder values remain
- Formats are correct (URLs, etc.)

---

## Security Best Practices

1. **Never commit real secrets** - Use `.env.local` and add to `.gitignore`
2. **Use AWS Secrets Manager** - For production secrets
3. **Rotate secrets regularly** - Every 90 days recommended
4. **Use strong random values** - 64+ characters for JWT secrets
5. **Use HTTPS URLs** - In production (no http://)
6. **Enable SSL for database** - Use ?sslmode=require in DATABASE_URL
7. **Different secrets per environment** - Don't reuse dev secrets
8. **Audit access logs** - Monitor who accesses secrets

---

## Troubleshooting

### "Database connection failed"
- Check DATABASE_URL is correct
- Verify network access to database host
- Ensure SSL setting matches (DB_SSL=true for AWS RDS)

### "CORS error"
- Verify FRONTEND_URL matches browser origin
- Check CORS_ORIGIN environment variable

### "Invalid JWT"
- Verify JWT_SECRET is set correctly
- Check JWT secrets haven't changed between requests
- Verify JWT_EXPIRES_IN is reasonable

### "Port already in use"
- Change PORT to different value
- Kill process using port: `lsof -i :4000`

### "Upload fails"
- Check UPLOAD_DIR exists and is writable
- Verify MAX_FILE_SIZE is not exceeded
- Check disk space available

---

**Last Updated**: 2026-06-07  
**Version**: 1.0.0
