# ✅ Deployment Checklist

Use this checklist to ensure your SR Logistics Fleet Management System deploys successfully.

## Pre-Deployment Checklist

### 1. Code Preparation
- [ ] All code is committed to Git repository
- [ ] Repository is pushed to GitHub/GitLab
- [ ] `.env` file is NOT committed (check `.gitignore`)
- [ ] All dependencies are listed in `package.json`
- [ ] Build command works locally: `npm run build`

### 2. Configuration Files
- [ ] `render.yaml` exists (for Render deployment)
- [ ] `railway.json` exists (for Railway deployment)
- [ ] `vercel.json` exists (for Vercel deployment)
- [ ] `Dockerfile` exists (for Docker-based deployments)
- [ ] `.env.example` is updated with all required variables

### 3. Environment Variables Needed
- [ ] `DATABASE_URL` - PostgreSQL connection string (set by platform or manually)
- [ ] `SESSION_SECRET` - Random secure string (use crypto to generate)

**Important:** Do NOT manually set `NODE_ENV` or `PORT` on hosted platforms - they are automatically configured!

## Deployment Checklist

### Option 1: Render.com
- [ ] Created Render account
- [ ] Connected GitHub/GitLab repository
- [ ] Created PostgreSQL database (or use Blueprint)
- [ ] Configured environment variables (DATABASE_URL, SESSION_SECRET only)
- [ ] Started deployment (migrations run automatically during build)
- [ ] Tested deployed app

### Option 2: Railway.app
- [ ] Created Railway account
- [ ] Connected GitHub repository
- [ ] Added PostgreSQL database (auto-sets DATABASE_URL)
- [ ] Configured environment variables (SESSION_SECRET only)
- [ ] Started deployment (migrations run automatically during build)
- [ ] Tested deployed app

### Option 3: Vercel + Neon
- [ ] Created Neon database account
- [ ] Got database connection string
- [ ] Created Vercel account
- [ ] Imported GitHub repository
- [ ] Configured environment variables
- [ ] Ran migrations locally
- [ ] Pushed to trigger deployment
- [ ] Tested deployed app

## Post-Deployment Checklist

### 1. Testing
- [ ] App loads without errors
- [ ] Login/Register works
- [ ] Dashboard displays correctly
- [ ] Can create vehicles
- [ ] Can create trips
- [ ] Can assign drivers
- [ ] Real-time tracking loads
- [ ] Responsive on mobile

### 2. Security
- [ ] Changed default SESSION_SECRET
- [ ] Database has strong password
- [ ] Admin credentials are secure
- [ ] No secrets in Git repository
- [ ] HTTPS is working

### 3. Monitoring
- [ ] Set up uptime monitoring (UptimeRobot)
- [ ] Configured error logging
- [ ] Checked deployment logs
- [ ] Set up email alerts (optional)

### 4. Performance
- [ ] App loads in < 3 seconds
- [ ] Database queries are optimized
- [ ] No console errors
- [ ] Images/assets load properly

### 5. Optional Enhancements
- [ ] Custom domain configured
- [ ] Favicon added
- [ ] Meta tags for SEO
- [ ] Analytics integrated (optional)
- [ ] Backup strategy in place

## Database Migration Commands

### Initial Migration
```bash
npm run db:push
```

### Force Migration (if schema changed)
```bash
npm run db:push -- --force
```

## Quick Test Commands

### Test Build Locally
```bash
npm run build
```

### Test Production Locally
```bash
npm run start
```

### Test Database Connection
```bash
# Set DATABASE_URL first
export DATABASE_URL="your-connection-string"
npm run db:push
```

## Common Issues & Solutions

### ❌ Build Failed
- Check Node.js version (should be 18+)
- Verify all dependencies installed
- Check build logs for specific errors

### ❌ Database Connection Failed
- Verify DATABASE_URL is correct
- Check if database is running
- Ensure IP whitelist allows connections

### ❌ App Crashes on Start
- Check PORT environment variable
- Verify all env variables are set
- Review application logs

### ❌ 502/504 Gateway Errors
- App might be starting (wait 30-60 seconds)
- Check if build completed successfully
- Verify start command is correct

## Platform-Specific Notes

### Render.com
- Free tier sleeps after 15 min inactivity
- Wakes up automatically on first request
- Use UptimeRobot to prevent sleeping

### Railway.app
- $5 credit per month (watch usage)
- No sleep time
- Good for active development

### Vercel
- Serverless functions have 10s timeout
- Best for frontend-heavy apps
- Need external database

---

## 🎉 Deployment Complete!

Once all items are checked:
1. ✅ Your app is live and accessible
2. ✅ Database is connected and working
3. ✅ All features are functional
4. ✅ Monitoring is in place

**Your deployment URL**: _________________

**Database URL**: _________________

**Deployment Date**: _________________

---

**Need Help?** Check `DEPLOYMENT.md` for detailed instructions.
