# Quick Start: Deploy TMSM

## 🚀 Choose Your Platform

### Option 1: AWS Elastic Beanstalk (Recommended for Production)

```bash
# 1. Install EB CLI
pip install awsebcli

# 2. Initialize
eb init -p node.js-22 tmsm-app

# 3. Create environment
eb create tmsm-prod

# 4. Set environment variables
eb setenv \
  DATABASE_URL="postgresql://user:password@your-rds-endpoint:5432/tmsm" \
  JWT_SECRET="your-generated-secret" \
  JWT_REFRESH_SECRET="your-refresh-secret" \
  SESSION_SECRET="your-session-secret"

# 5. Deploy
eb deploy

# 6. Monitor
eb status
eb logs
```

**Config File**: `.env.eba`  
**Docs**: `DEPLOYMENT_EBA.md`

---

### Option 2: Render.com (Easiest to Start)

```bash
# 1. Push changes to GitHub (already done ✅)

# 2. Go to https://render.com
#    - Click "New +" → Select "Web Service"
#    - Connect GitHub repository

# 3. Configure:
#    - Runtime: Node 22
#    - Build command: npm install
#    - Start command: npm run start

# 4. Add Environment Variables:
#    DATABASE_URL=postgresql://...
#    JWT_SECRET=...
#    JWT_REFRESH_SECRET=...
#    SESSION_SECRET=...

# 5. Click "Deploy"
```

**Config File**: `.env.render`  
**Docs**: `DEPLOYMENT_RENDER.md`

---

### Option 3: Docker (Any Server/Cloud)

```bash
# 1. Build
docker build -t tmsm:latest .

# 2. Run
docker run -p 4000:4000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  tmsm:latest

# 3. Use Docker Compose
docker-compose up -d
```

**Config File**: `docker-compose.yml` + `.env.production`

---

## 📋 Pre-Deployment Checklist

- [ ] Database ready (RDS/Render PostgreSQL)
- [ ] Generated JWT secrets:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- [ ] Updated DATABASE_URL with real endpoint
- [ ] Updated FRONTEND_URL with your domain
- [ ] Updated S3 bucket name (if using)
- [ ] Tested locally: `npm run dev`
- [ ] Changes pushed to GitHub ✅

---

## 🔧 Critical Environment Variables

| Variable | Value | Example |
|----------|-------|---------|
| `NODE_ENV` | production | production |
| `PORT` | 4000-4003 | 4000 |
| `DATABASE_URL` | PostgreSQL connection | postgresql://user:pass@host:5432/db |
| `JWT_SECRET` | 64-byte hex | 7f8c9d0e... (64 chars) |
| `JWT_REFRESH_SECRET` | 64-byte hex | a1b2c3d4... (64 chars) |
| `SESSION_SECRET` | Secure token | 9z8y7x6w... |
| `FRONTEND_URL` | Your domain | https://tmsm-app.com |
| `CORS_ORIGIN` | Your domain | https://tmsm-app.com |

---

## ✅ Verify Deployment

After deployment:

```bash
# 1. Check health
curl https://your-domain/api/v1/health
# Response: { "status": "ok", "service": "Dabub Connect API" }

# 2. Check logs
# Elastic Beanstalk: eb logs
# Render: Dashboard > Logs

# 3. Test API endpoint
curl https://your-domain/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🛑 Troubleshooting

### Database Connection Failed
```
❌ PostgreSQL connection failed: getaddrinfo ENOTFOUND
```
**Fix**: Verify `DATABASE_URL` is set correctly in environment variables

### Port Already in Use
```
❌ EADDRINUSE: address already in use :::4000
```
**Fix**: Change `PORT` or kill process: `lsof -i :4000`

### SSL Certificate Error
```
❌ CERTIFICATE_VERIFY_FAILED
```
**Fix**: Set `DB_SSL=true` if using RDS with SSL

### Deployment Timeout
**Fix**: Check logs, ensure npm install completes, increase timeout in config

---

## 📚 Full Documentation

- **Elastic Beanstalk**: See `DEPLOYMENT_EBA.md`
- **Render.com**: See `DEPLOYMENT_RENDER.md`
- **Summary of all fixes**: See `DEPLOYMENT_SUMMARY.md`
- **Environment templates**: See `.env.example`

---

## 🔐 Security Notes

1. **Never commit `.env` files with real secrets**
2. **Use AWS Secrets Manager for production**
3. **Rotate JWT secrets regularly**
4. **Enable HTTPS/SSL always**
5. **Keep Node.js updated**
6. **Monitor logs and errors**

---

## 📞 Getting Help

If deployment fails:

1. Check logs first: `eb logs` or Render dashboard
2. Verify all environment variables are set
3. Test database connection: `node -e "require('pg').Client"`
4. Check GitHub commit: `git log --oneline` (should show recent deployment configs)
5. Review detailed docs: `DEPLOYMENT_EBA.md` or `DEPLOYMENT_RENDER.md`

---

**Ready to deploy? Pick a platform above and follow the steps! 🚀**
