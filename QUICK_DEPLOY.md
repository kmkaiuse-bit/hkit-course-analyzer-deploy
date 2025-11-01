# 🚀 Quick Deploy Guide - Get Your App Online in 30 Minutes

## Choose Your Platform

### Option 1: Railway.app (Recommended) ⭐

**Cost**: $5-10/month | **Time**: 30 minutes | **Difficulty**: Easy

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "Initial deployment"
git remote add origin https://github.com/YOUR_USERNAME/hkit-analyzer.git
git push -u origin main

# 2. Go to railway.app
# - Sign in with GitHub
# - Click "New Project" → "Deploy from GitHub repo"
# - Select your repository
# - Railway auto-detects Node.js

# 3. Add Environment Variables in Railway Dashboard
GEMINI_API_KEY=your_api_key_here
NODE_ENV=production
PORT=3001

# 4. Generate domain and you're live!
```

**Your app will be at**: `https://your-project.up.railway.app`

---

### Option 2: Render.com (Free Tier Available)

**Cost**: Free (with limitations) or $7/month | **Time**: 30 minutes

```bash
# 1. Push to GitHub (same as above)

# 2. Go to render.com
# - Sign in with GitHub
# - Click "New +" → "Web Service"
# - Connect your repository
# - Use these settings:
#   - Build Command: npm install
#   - Start Command: npm start
#   - Environment: Node

# 3. Add Environment Variables
GEMINI_API_KEY=your_api_key_here
NODE_ENV=production

# 4. Deploy!
```

**Your app will be at**: `https://your-service.onrender.com`

---

### Option 3: Vercel (Frontend) + Railway (Backend)

**Cost**: Free frontend + $5 backend | **Time**: 45 minutes

**Backend (Railway)**:
```bash
# Deploy server folder to Railway (as above)
# Note the backend URL: https://your-backend.up.railway.app
```

**Frontend (Vercel)**:
```bash
# 1. Update frontend API URL in local/assets/js/gemini-api.js:
const backendUrl = 'https://your-backend.up.railway.app/api/gemini';

# 2. Go to vercel.com
# - Import from GitHub
# - Root Directory: local
# - Framework Preset: Other
# - Deploy!
```

---

## Pre-Deployment Checklist

- [ ] Get Gemini API key from https://makersuite.google.com/app/apikey
- [ ] Create GitHub account and repository
- [ ] Choose hosting platform (Railway recommended)
- [ ] Have credit card ready ($5 minimum for Railway)

---

## Post-Deployment Testing

Once deployed, test these:

1. **Health Check**:
   ```bash
   curl https://your-app-url/api/health
   ```
   Should return: `{"status":"ok",...}`

2. **Open Frontend**:
   - Visit your app URL
   - Check "Backend Server Status" shows green ✅

3. **Test Analysis**:
   - Upload a sample transcript
   - Select a program
   - Click Analyze
   - Verify results appear

---

## Common Issues & Fixes

### "Cannot connect to backend server"
- Check Railway service is running (Dashboard → View Logs)
- Verify `GEMINI_API_KEY` is set in environment variables
- Restart the service

### "API key not configured"
- Add `GEMINI_API_KEY` in Railway/Render dashboard
- Restart service after adding

### "Module not found"
- Check `package.json` includes all dependencies
- Ensure build command is `npm install`
- Redeploy

---

## Need the Full Plan?

See **`DEPLOYMENT_PLAN.md`** for detailed step-by-step instructions, all options, and troubleshooting.

---

## Quick Cost Comparison

| Platform | Monthly Cost | Free Tier | Best For |
|----------|-------------|-----------|----------|
| **Railway** | $5-10 | No | Production (Recommended) |
| **Render** | $0-7 | Yes* | Testing/Demo |
| **Vercel + Railway** | $5 | Frontend free | Hybrid approach |
| **Google Cloud** | $10-20 | $300 credit | Enterprise |

*Render free tier sleeps after inactivity

---

## Ready to Deploy?

**Recommended Fast Track**:
1. Choose Railway
2. Push code to GitHub
3. Connect to Railway
4. Add API key
5. Deploy!

**Total time: 30 minutes** ⏱️

Need help? Check `DEPLOYMENT_PLAN.md` for detailed instructions!
