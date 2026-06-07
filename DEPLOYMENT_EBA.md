# AWS Elastic Beanstalk Deployment Guide
## Arba Minch Transport Management System (TMSM)

### Prerequisites
- AWS Account with appropriate permissions
- AWS CLI configured locally
- Elastic Beanstalk CLI (EB CLI) installed
- Node.js 18+ (for local testing)
- PostgreSQL database (RDS recommended)

### Step 1: Install and Configure EB CLI

```bash
# Install EB CLI
pip install awsebcli --upgrade --user

# Configure AWS credentials
aws configure

# Verify installation
eb --version
```

### Step 2: Prepare Your Environment File

1. Update `.env.eba` with your values:
   ```bash
   FRONTEND_URL=https://your-domain.elasticbeanstalk.com
   CORS_ORIGIN=https://your-domain.elasticbeanstalk.com
   DATABASE_URL=postgresql://user:pass@your-rds-endpoint:5432/tmsm
   AWS_S3_BUCKET=your-bucket-name
   ```

2. Generate strong secrets:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

3. Update JWT secrets and session secret in `.env.eba`

### Step 3: Create Elastic Beanstalk Application

```bash
# Navigate to project root
cd /path/to/project

# Initialize Elastic Beanstalk
eb init -p node.js-18 tmsm-app

# Create an environment
eb create tmsm-prod --instance-type t3.medium

# Or use the EB console to create manually
```

### Step 4: Set Environment Variables

#### Option A: Using EB CLI
```bash
eb setenv NODE_ENV=production \
  FRONTEND_URL=https://your-domain.elasticbeanstalk.com \
  DATABASE_URL=postgresql://user:pass@host:5432/db \
  JWT_SECRET=your-secret \
  JWT_REFRESH_SECRET=your-refresh-secret \
  SESSION_SECRET=your-session-secret \
  AWS_S3_BUCKET=your-bucket
```

#### Option B: Using AWS Systems Manager Parameter Store (Recommended for secrets)
```bash
# Store secrets securely
aws ssm put-parameter \
  --name /tmsm/jwt-secret \
  --value "your-strong-secret" \
  --type SecureString

aws ssm put-parameter \
  --name /tmsm/db-url \
  --value "postgresql://..." \
  --type SecureString

# Then reference in EB environment variables
```

### Step 5: Configure RDS Database

```bash
# Create RDS instance (or use existing)
aws rds create-db-instance \
  --db-instance-identifier tmsm-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password 'your-strong-password' \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxxxxx

# Update security group to allow Elastic Beanstalk access
```

### Step 6: Configure S3 Bucket for Uploads

```bash
# Create S3 bucket
aws s3 mb s3://tmsm-uploads-prod

# Block public access
aws s3api put-public-access-block \
  --bucket tmsm-uploads-prod \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Set lifecycle policy
cat > lifecycle.json << 'EOF'
{
  "Rules": [
    {
      "Id": "DeleteOldUploads",
      "Status": "Enabled",
      "Prefix": "temp/",
      "Expiration": {
        "Days": 7
      }
    }
  ]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
  --bucket tmsm-uploads-prod \
  --lifecycle-configuration file://lifecycle.json
```

### Step 7: Configure IAM Role for Elastic Beanstalk

Attach policy to `aws-elasticbeanstalk-ec2-role`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::tmsm-uploads-prod/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters"
      ],
      "Resource": "arn:aws:ssm:*:*:parameter/tmsm/*"
    }
  ]
}
```

### Step 8: Deploy Application

```bash
# Deploy to Elastic Beanstalk
eb deploy

# Monitor deployment
eb status
eb logs
```

### Step 9: Connect Custom Domain

1. Update Route53 DNS records to point to Elastic Beanstalk URL
2. Request SSL certificate in ACM (or use existing)
3. Configure HTTPS listener in Load Balancer settings

### Step 10: Verify Deployment

```bash
# Check health
eb health
eb open

# View logs
eb logs --all

# SSH into instance
eb ssh
```

### Post-Deployment Verification

1. Check API endpoints:
   ```bash
   curl https://your-domain/api/v1/health
   ```

2. Verify database connection:
   ```bash
   eb ssh
   npm run check-db
   ```

3. Check S3 bucket connectivity:
   ```bash
   # Upload test file
   aws s3 cp test.txt s3://tmsm-uploads-prod/test.txt
   ```

4. Monitor CloudWatch logs:
   - Navigate to CloudWatch > Log Groups
   - Look for `/aws/elasticbeanstalk/tmsm/var/log/app.log`

### Scaling Configuration

Edit `.ebextensions/01_nodejs.config` to adjust:

```yaml
aws:autoscaling:asg:
  MinSize: 2          # Minimum instances
  MaxSize: 10         # Maximum instances
  Cooldown: 300       # Scale-down wait time (seconds)

aws:autoscaling:trigger:
  MeasureName: CPUUtilization
  Statistic: Average
  Unit: Percent
  UpperThreshold: 80
  LowerThreshold: 30
```

### Database Migrations

For schema changes:

```bash
# SSH into instance
eb ssh

# Run migrations
npm run migrate

# Exit SSH
exit
```

### Environment Variables from .env.eba

Key variables to configure:

| Variable | Purpose | Example |
|----------|---------|---------|
| NODE_ENV | Environment | production |
| DATABASE_URL | PostgreSQL connection | postgresql://... |
| JWT_SECRET | Token signing key | (64-byte hex) |
| AWS_S3_BUCKET | File uploads | tmsm-uploads-prod |
| REDIS_URL | Cache backend | redis://endpoint |
| SMTP_HOST | Email service | email-smtp.us-east-1.amazonaws.com |

### Troubleshooting

**Deployment fails:**
```bash
eb logs
eb ssh
cat /var/log/eb-engine.log
```

**Database connection error:**
- Verify security group allows traffic on port 5432
- Check credentials in DATABASE_URL
- Confirm RDS instance is accessible from Elastic Beanstalk

**S3 upload failures:**
- Verify IAM role has S3 permissions
- Check bucket name in AWS_S3_BUCKET
- Ensure bucket exists and is accessible

**Memory/CPU issues:**
- Scale up instance type: `eb scale 4 --instance-type t3.large`
- Adjust Node memory: `NODE_OPTIONS=--max-old-space-size=512`

### Useful Commands

```bash
# View environment status
eb status

# View health information
eb health

# SSH into instance
eb ssh

# View logs in real-time
eb logs --stream

# Set environment variable
eb setenv KEY=VALUE

# Terminate environment
eb terminate tmsm-prod

# List all environments
eb list

# Switch environment
eb use tmsm-prod
```

### Security Best Practices

1. **Never commit `.env.eba` with real secrets** to version control
2. **Use AWS Secrets Manager** for sensitive data
3. **Enable HTTPS** on all endpoints
4. **Configure security groups** to restrict access
5. **Enable CloudWatch monitoring** for alerts
6. **Use VPC** for database and cache layers
7. **Enable WAF** for DDoS protection
8. **Rotate credentials** regularly

### Cost Optimization

- Use Reserved Instances for production
- Enable Auto Scaling instead of fixed instances
- Use ElastiCache to reduce database load
- Clean up old logs regularly
- Monitor CloudWatch metrics for right-sizing

### Support & Resources

- [AWS Elastic Beanstalk Documentation](https://docs.aws.amazon.com/elasticbeanstalk/)
- [EB CLI Reference](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3.html)
- [Node.js on Elastic Beanstalk](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create-deploy-nodejs.html)
