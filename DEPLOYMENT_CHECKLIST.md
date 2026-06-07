# TMSM Deployment Checklist

**Status**: Ready for production deployment after all fixes applied  
**Last Updated**: June 7, 2026  
**Version**: 2.0 (Post-Security-Fixes)

---

## 🔴 CRITICAL: Before Any Deployment

### Security Validation
- [ ] Run `npm run validate-env` - Ensures all required variables are set
- [ ] Check that NO placeholder values remain (e.g., "your-rds-endpoint")
- [ ] Verify JWT secrets are 64+ characters and NOT from example files
- [ ] Ensure DATABASE_URL includes credentials and is complete
- [ ] Confirm FRONTEND_URL is production domain (HTTPS required)
- [ ] Verify NODE_ENV is set to `production`
- [ ] Check that .gitignore includes .env files
- [ ] Review that no secrets are committed to git history

### Generate Production Secrets
```bash
# Generate 3 new secrets for production
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Copy outputs to:
# 1. JWT_SECRET
# 2. JWT_REFRESH_SECRET  
# 3. SESSION_SECRET
```

- [ ] JWT_SECRET generated and updated
- [ ] JWT_REFRESH_SECRET generated and updated
- [ ] SESSION_SECRET generated and updated
- [ ] All three secrets are different
- [ ] All three secrets are 64+ characters

---

## 📋 Pre-Deployment Setup (Choose Your Platform)

### Option A: AWS Elastic Beanstalk

#### Prerequisites
- [ ] AWS Account created
- [ ] AWS CLI installed and configured
- [ ] EB CLI installed (`pip install awsebcli`)
- [ ] RDS PostgreSQL instance created or provisioned
- [ ] S3 bucket created for uploads
- [ ] ElastiCache Redis instance created (optional but recommended)
- [ ] IAM roles configured (elastic-beanstalk-service-role, elastic-beanstalk-ec2-role)

#### Environment Variables Setup
- [ ] DATABASE_URL pointing to RDS endpoint with SSL
- [ ] S3 bucket name configured
- [ ] ElastiCache endpoint configured in REDIS_URL (if using)
- [ ] Application domain configured for FRONTEND_URL
- [ ] SSL certificate obtained (ACM)

#### Database Preparation
- [ ] PostgreSQL database created in RDS
- [ ] Database user created with appropriate permissions
- [ ] Database is accessible from Elastic Beanstalk instances
- [ ] SSL enabled on RDS database
- [ ] Automated backups enabled on RDS

#### Commands to Run
```bash
# 1. Initialize
eb init -p node.js-22 tmsm-app

# 2. Create environment
eb create tmsm-prod --instance-type t3.medium

# 3. Set environment variables via AWS Console or CLI
eb setenv DATABASE_URL="..." JWT_SECRET="..." ...

# 4. Deploy
eb deploy

# 5. Monitor
eb status
eb logs
```

---

### Option B: Render.com

#### Prerequisites
- [ ] Render.com account created
- [ ] GitHub repository connected to Render
- [ ] GitHub personal access token created (if needed)

#### Database Setup via Render Dashboard
- [ ] PostgreSQL service created
- [ ] Database name: `tmsm`
- [ ] Database connection string copied
- [ ] Database URL includes credentials
- [ ] SSL mode verified

#### Environment Variables Setup (Render Dashboard)
- [ ] PORT: `4000`
- [ ] NODE_ENV: `production`
- [ ] DATABASE_URL: (from PostgreSQL service)
- [ ] JWT_SECRET: (64-char hex)
- [ ] JWT_REFRESH_SECRET: (64-char hex)
- [ ] SESSION_SECRET: (64-char hex)
- [ ] FRONTEND_URL: (your domain)
- [ ] CORS_ORIGIN: (your domain)

#### Deployment via Render Dashboard
- [ ] Go to Render.com > New Web Service
- [ ] Connect GitHub repo
- [ ] Select main branch
- [ ] Runtime: Node 22
- [ ] Build command: `npm install`
- [ ] Start command: `npm start`
- [ ] Add all environment variables
- [ ] Click Deploy

---

### Option C: Docker (Custom Server)

#### Prerequisites
- [ ] Docker and Docker Compose installed
- [ ] PostgreSQL instance available (local or cloud)
- [ ] Redis instance available (optional)
- [ ] Server with Docker daemon running

#### .env.production Setup
- [ ] All environment variables configured
- [ ] DATABASE_URL pointing to your PostgreSQL
- [ ] FRONTEND_URL pointing to your application URL
- [ ] All secrets generated and set

#### Deployment
```bash
# 1. Build image
docker build -t tmsm:latest .

# 2. Run container with environment file
docker run -p 4000:4000 \
  --env-file .env.production \
  tmsm:latest

# OR with docker-compose
docker-compose up -d
```

- [ ] Container builds successfully
- [ ] Container starts without errors
- [ ] Health check endpoint responds
- [ ] Database connection established

---

## 🗄️ Database Preparation (All Platforms)

### Initial Setup
- [ ] PostgreSQL version 13+ installed/provisioned
- [ ] Database `tmsm` created
- [ ] Database user created with full privileges
- [ ] SSL/TLS enabled on production databases
- [ ] Connection string verified and tested
- [ ] Network access rules configured (security groups)
- [ ] Backups configured (if needed)

### Migration & Seeding
- [ ] Run `npm run migrate` to create tables
- [ ] Run `npm run seed` to populate initial data (if needed)
- [ ] Verify all tables created: `\dt` in psql
- [ ] Check admin account exists (if seeded)
- [ ] Verify no errors in migration logs

### Backup Strategy
- [ ] Automated daily backups enabled
- [ ] Backup retention policy set (7-30 days)
- [ ] Backup restoration tested
- [ ] Off-site backup storage configured

---

## 🔐 Security Configuration

### Network & Access
- [ ] Database security group configured
- [ ] Only app server can access database port
- [ ] Application server has public IP (if needed)
- [ ] SSL/TLS enabled on all endpoints
- [ ] Firewall rules reviewed and tested
- [ ] DDoS protection enabled (if available)

### Secrets Management
- [ ] Secrets stored in AWS Secrets Manager (EBA)
- [ ] Secrets stored in Render Secrets (Render.com)
- [ ] Secrets NOT in git repository
- [ ] No hardcoded passwords in code
- [ ] Secrets Manager access restricted to app role

### Authentication & Authorization
- [ ] JWT secrets strong and unique
- [ ] Password hashing configured (bcryptjs)
- [ ] CORS restricted to valid origins only
- [ ] Rate limiting configured
- [ ] API authentication required for protected endpoints

### Data Protection
- [ ] Database SSL/TLS required
- [ ] Encrypted connections for all services
- [ ] Data encryption at rest (if available)
- [ ] PII data handling reviewed
- [ ] GDPR/privacy compliance checked

---

## 📊 Monitoring & Logging Setup

### Application Monitoring
- [ ] Logging to CloudWatch (AWS) or Render logs
- [ ] Log level set to `info` (not debug in production)
- [ ] Error alerts configured
- [ ] Application metrics monitored
- [ ] Health check endpoint verified

### Performance Monitoring
- [ ] CPU utilization monitored
- [ ] Memory usage monitored
- [ ] Database query performance checked
- [ ] API response times tracked
- [ ] Uptime monitoring enabled

### Alerting
- [ ] High CPU alert configured (>80%)
- [ ] High memory alert configured (>85%)
- [ ] Database error alert configured
- [ ] API error rate alert configured (>1%)
- [ ] Downtime alert configured
- [ ] Alert recipients configured

### Log Analysis
- [ ] Logs viewable in dashboard
- [ ] Log retention policy set
- [ ] Search/filter working
- [ ] Error logs reviewed for issues

---

## 📈 Scaling Configuration (Elastic Beanstalk / Render)

### Auto-Scaling Setup
- [ ] Min instances: 2
- [ ] Max instances: 10
- [ ] Scale-up threshold: 70% CPU
- [ ] Scale-down threshold: 30% CPU
- [ ] Cool-down period: 300 seconds

### Load Balancing
- [ ] Load balancer health check configured
- [ ] Health check interval: 30 seconds
- [ ] Health check timeout: 10 seconds
- [ ] Healthy threshold: 2
- [ ] Unhealthy threshold: 3

### Cache Configuration (if using Redis)
- [ ] Redis instance provisioned
- [ ] Connection string configured
- [ ] Memory limits set appropriately
- [ ] Eviction policy configured (allkeys-lru)
- [ ] Persistence enabled (if needed)

---

## 🧪 Pre-Production Testing

### Functionality Testing
- [ ] Run `npm run validate-env` - passes
- [ ] Application starts without errors
- [ ] Health check endpoint responds: `GET /api/v1/health`
- [ ] All critical API endpoints tested
- [ ] Authentication/login works
- [ ] File uploads working
- [ ] Socket.IO connections working
- [ ] Database queries working

### Integration Testing
- [ ] Frontend can reach API
- [ ] Frontend-backend communication working
- [ ] Real-time updates working (Socket.IO)
- [ ] Email notifications working (if configured)
- [ ] File storage working (S3 or local)
- [ ] Redis caching working (if enabled)

### Load Testing
- [ ] Test with 100 concurrent users
- [ ] Test with 1000 requests per second
- [ ] Monitor response times under load
- [ ] Verify auto-scaling triggers
- [ ] Check database connection pooling

### Security Testing
- [ ] HTTPS/SSL verified working
- [ ] CORS restrictions verified
- [ ] API authentication required on protected endpoints
- [ ] Rate limiting working
- [ ] No exposed secrets in logs
- [ ] SQL injection protection verified
- [ ] XSS protection verified

### Browser Compatibility
- [ ] Chrome/Edge: ✓
- [ ] Firefox: ✓
- [ ] Safari: ✓
- [ ] Mobile browsers: ✓

---

## 📦 Deployment Steps (Final)

### 1. Pre-Deployment Backup
- [ ] Database backup created
- [ ] Code backup created (git tag)
- [ ] Configuration backup created
- [ ] Restore procedure documented

### 2. Environment Configuration
- [ ] All environment variables set correctly
- [ ] Environment validation passes: `npm run validate-env`
- [ ] Configuration file (.env.production) prepared
- [ ] Secrets securely stored

### 3. Build & Test
- [ ] `npm install` runs without errors
- [ ] `npm run build` (if applicable) completes
- [ ] Docker build succeeds (if using Docker)
- [ ] No warnings or errors in build output

### 4. Deploy
- [ ] Database migrations run: `npm run migrate`
- [ ] Application starts successfully
- [ ] No errors in startup logs
- [ ] Health check endpoint responds

### 5. Post-Deployment Verification
- [ ] Health check passing: `curl https://your-domain/api/v1/health`
- [ ] Application accessible from browser
- [ ] All endpoints responding
- [ ] No error logs
- [ ] Database queries working
- [ ] Real-time features working

### 6. Smoke Tests
- [ ] Login works
- [ ] Can create/read/update data
- [ ] File uploads work
- [ ] API responses correct
- [ ] No 500 errors
- [ ] Performance acceptable

---

## ✅ Post-Deployment Checklist

### Immediate (First Hour)
- [ ] Monitor error logs for issues
- [ ] Check application metrics
- [ ] Verify database connections stable
- [ ] Test critical user paths
- [ ] Monitor API response times
- [ ] Check for any security alerts

### Short-term (First Day)
- [ ] Monitor auto-scaling behavior
- [ ] Review CloudWatch logs
- [ ] Check database performance
- [ ] Verify backups completed
- [ ] Monitor error rate
- [ ] Check resource usage

### Long-term (First Week)
- [ ] Review all logs for patterns
- [ ] Monitor performance trends
- [ ] Verify alerting system working
- [ ] Test failover/recovery
- [ ] Document any issues found
- [ ] Update runbooks

### Ongoing
- [ ] Daily log review
- [ ] Weekly performance analysis
- [ ] Monthly security audit
- [ ] Quarterly capacity planning
- [ ] Regular backup testing
- [ ] Security patch updates

---

## 🆘 Rollback Procedure

If deployment fails or issues arise:

```bash
# 1. Stop affected services
docker stop tmsm  # or: eb abort / Render > Cancel Deployment

# 2. Restore from backup
# Database: Restore from RDS snapshot
# Application: Previous version from git tag

# 3. Verify restoration
npm run health-check

# 4. Investigation
# Check error logs
# Review configuration
# Run tests

# 5. Fix and re-deploy
# Make necessary changes
# Test thoroughly
# Deploy again
```

Rollback time target: < 15 minutes

---

## 📞 Deployment Support

### Useful Commands

```bash
# Validation
npm run validate-env

# Health check
npm run health-check

# Logs
eb logs  # Elastic Beanstalk
docker logs tmsm  # Docker
# Render dashboard for Render.com

# Database
psql $DATABASE_URL  # Connect to database
npm run migrate  # Run migrations
npm run seed  # Seed initial data

# Environment info
echo $NODE_ENV
echo $PORT
echo $DATABASE_URL
```

### Emergency Contacts
- [ ] DevOps team contact info documented
- [ ] Database admin contact info documented
- [ ] Cloud provider support link saved
- [ ] On-call rotation schedule documented

---

## 🎯 Success Criteria

Deployment is successful when:

- ✅ Application starts without errors
- ✅ All environment variables validated
- ✅ Health check endpoint responds
- ✅ Database connection established
- ✅ Frontend can reach API
- ✅ Critical user paths work
- ✅ No error logs
- ✅ Performance metrics normal
- ✅ Security checks passed
- ✅ Alerting working

---

## 📝 Notes

### Known Issues
- None currently documented

### Workarounds
- None currently documented

### Future Improvements
- [ ] Implement CI/CD pipeline
- [ ] Automated testing before deploy
- [ ] Blue-green deployment strategy
- [ ] Database migration versioning
- [ ] Incident response runbook
- [ ] Disaster recovery plan

---

**Deployment Checklist Version 2.0**  
**All security and configuration fixes applied**  
**Ready for production deployment**

---

## Quick Links

- [Environment Variables Reference](ENV_VARIABLES.md)
- [Deployment Summary](DEPLOYMENT_SUMMARY.md)
- [Quick Start Guide](QUICK_START_DEPLOYMENT.md)
- [AWS EBA Guide](DEPLOYMENT_EBA.md)
- [Render Guide](DEPLOYMENT_RENDER.md)
- [Verification Report](DEPLOYMENT_VERIFICATION.md)

**Status**: 🟢 READY FOR DEPLOYMENT
