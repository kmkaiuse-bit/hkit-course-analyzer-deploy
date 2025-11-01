# 🚀 HKIT Course Analyzer - Complete Deployment Plan

## Executive Summary

**Goal**: Deploy HKIT Course Analyzer to a production server accessible via public URL

**Recommended Platform**: Railway.app (All-in-One Solution)

**Estimated Time**: 2-3 hours for initial deployment

**Monthly Cost**: $5-15 USD

---

## 📊 Architecture Overview

### Current Local Setup
```
┌─────────────────────────────────────────┐
│  Browser (localhost:8000)               │
│  ├── Frontend (HTML/CSS/JS)            │
│  └── Calls → Backend API               │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│  Backend Server (localhost:3001)        │
│  ├── Express.js API                     │
│  ├── Gemini API Proxy                   │
│  └── Learning Database API              │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│  PostgreSQL Database (localhost:5432)   │
│  └── Learning Patterns Storage          │
└─────────────────────────────────────────┘
```

### Production Deployment (Railway)
```
┌─────────────────────────────────────────┐
│  User's Browser                         │
│  └── https://your-app.up.railway.app   │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│  Railway Project                         │
│  ┌───────────────────────────────────┐  │
│  │ Frontend Service (Static)         │  │
│  │ ├── Port: 8000                    │  │
│  │ ├── Serves HTML/CSS/JS            │  │
│  │ └── Public URL assigned           │  │
│  └───────────────────────────────────┘  │
│                ↓                         │
│  ┌───────────────────────────────────┐  │
│  │ Backend Service (Node.js)         │  │
│  │ ├── Port: 3001                    │  │
│  │ ├── Express API Server            │  │
│  │ ├── Gemini API Proxy              │  │
│  │ └── Internal URL assigned         │  │
│  └───────────────────────────────────┘  │
│                ↓                         │
│  ┌───────────────────────────────────┐  │
│  │ PostgreSQL Database (Optional)    │  │
│  │ ├── Managed PostgreSQL            │  │
│  │ ├── Auto backups                  │  │
│  │ └── Connection string provided    │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 🎯 Deployment Options Comparison

### Option 1: Railway.app ⭐ **RECOMMENDED**

**Pros:**
- ✅ No timeout limits (vs Vercel's 10s)
- ✅ All-in-one: Backend + Frontend + Database
- ✅ Simple deployment from GitHub
- ✅ Affordable ($5-15/month)
- ✅ Built-in PostgreSQL
- ✅ Automatic HTTPS
- ✅ Environment variable management
- ✅ Easy scaling

**Cons:**
- ❌ Pay-per-use pricing (predictable though)
- ❌ $5 credit required to start

**Best For**: Production deployment with full features

**Setup Time**: 1-2 hours

**Monthly Cost**: $5-15

---

### Option 2: Render.com

**Pros:**
- ✅ Free tier available
- ✅ Supports static sites + backend
- ✅ Free PostgreSQL (limited)
- ✅ Auto-deploy from GitHub
- ✅ Good documentation

**Cons:**
- ❌ Free tier spins down after inactivity
- ❌ Slower cold starts
- ❌ Limited free database storage

**Best For**: Testing/demo deployments

**Setup Time**: 1-2 hours

**Monthly Cost**: $0 (free tier) or $7+ (paid)

---

### Option 3: Google Cloud Run + Cloud SQL

**Pros:**
- ✅ Highly scalable
- ✅ Pay only for usage
- ✅ Google infrastructure
- ✅ Integrates with other Google services

**Cons:**
- ❌ More complex setup
- ❌ Requires Docker knowledge
- ❌ Harder to debug
- ❌ More configuration needed

**Best For**: Enterprise deployments, high traffic

**Setup Time**: 3-4 hours

**Monthly Cost**: $10-30

---

### Option 4: Digital Ocean Droplet (VPS)

**Pros:**
- ✅ Full server control
- ✅ Predictable pricing ($6/month)
- ✅ Can host multiple apps
- ✅ No vendor lock-in

**Cons:**
- ❌ Requires server management
- ❌ Manual security updates
- ❌ Need to configure everything
- ❌ No automatic scaling

**Best For**: Multiple applications, full control needed

**Setup Time**: 4-6 hours

**Monthly Cost**: $6-12

---

### Option 5: Vercel Pro (Original Plan)

**Pros:**
- ✅ Codebase already configured
- ✅ Simple deployment
- ✅ Fast CDN
- ✅ Good for static sites

**Cons:**
- ❌ $20/month (expensive for single app)
- ❌ 60s timeout (still might not be enough)
- ❌ Serverless functions only
- ❌ Need separate database solution

**Best For**: If already using Vercel for other projects

**Setup Time**: 30 minutes

**Monthly Cost**: $20

---

## 🚀 Detailed Railway Deployment Guide

### Prerequisites

1. **GitHub Account** (to connect repository)
2. **Railway Account** (sign up at railway.app)
3. **Gemini API Key** (from Google AI Studio)
4. **Credit Card** ($5 initial credit required)

### Step-by-Step Deployment

#### **Step 1: Prepare Your Repository** (15 minutes)

1. **Push code to GitHub**:
```bash
cd hkit-course-analyzer-deploy
git init
git add .
git commit -m "Prepare for Railway deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/hkit-analyzer.git
git push -u origin main
```

2. **Verify these files exist**:
   - ✅ `package.json` with correct start script
   - ✅ `.env.example` (template)
   - ✅ `.gitignore` (excludes .env)
   - ✅ `server/learning-server.js`

---

#### **Step 2: Create Railway Project** (10 minutes)

1. **Sign up at Railway**:
   - Go to https://railway.app
   - Sign in with GitHub
   - Add $5 credit (required for deployment)

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Authorize Railway to access your GitHub
   - Select your `hkit-analyzer` repository

3. **Railway will detect Node.js and auto-configure**

---

#### **Step 3: Configure Backend Service** (15 minutes)

1. **Set Environment Variables**:
   - Go to your project → Variables tab
   - Add these variables:
   ```
   NODE_ENV=production
   PORT=3001
   GEMINI_API_KEY=your_api_key_here
   LEARNING_ENABLED=true
   ```

2. **Configure Build & Start**:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Port: `3001`

3. **Generate Domain**:
   - Go to Settings → Domains
   - Click "Generate Domain"
   - You'll get: `your-app.up.railway.app`
   - **Save this URL!**

---

#### **Step 4: Add PostgreSQL Database** (Optional, 10 minutes)

1. **Add Database Service**:
   - In your project, click "+ New"
   - Select "Database" → "PostgreSQL"
   - Railway provisions automatically

2. **Get Connection Details**:
   - Click on PostgreSQL service
   - Go to "Connect" tab
   - Copy connection string

3. **Add Database Variables to Backend**:
   ```
   DATABASE_URL=postgresql://...
   DB_HOST=...
   DB_PORT=5432
   DB_NAME=...
   DB_USER=...
   DB_PASSWORD=...
   ```

4. **Initialize Database Schema**:
   - Connect via Railway CLI or SQL client
   - Run your schema creation scripts
   - Or use migration scripts in your repo

---

#### **Step 5: Deploy Frontend as Static Site** (10 minutes)

**Option A: Same Railway Project**

1. **Add Static Site Service**:
   - In project, click "+ New"
   - Select "Empty Service"
   - Name it "frontend"

2. **Configure Static Files**:
   - Set Root Directory: `/local`
   - Build Command: (none)
   - Start Command: `python -m http.server 8000` or use `serve` package

**Option B: Separate Static Hosting (Vercel/Netlify)**

1. **Deploy to Vercel** (for frontend only):
   - Go to vercel.com
   - Import your GitHub repo
   - Set Root Directory: `local`
   - Deploy as static site

---

#### **Step 6: Update Frontend API URL** (5 minutes)

In your frontend code, update the backend URL:

**File**: `local/assets/js/gemini-api.js`

```javascript
// Change from:
const backendUrl = 'http://localhost:3001/api/gemini';

// To:
const backendUrl = 'https://your-backend.up.railway.app/api/gemini';
```

Or better, make it environment-aware:
```javascript
const backendUrl = process.env.NODE_ENV === 'production'
    ? 'https://your-backend.up.railway.app/api/gemini'
    : 'http://localhost:3001/api/gemini';
```

---

#### **Step 7: Configure CORS** (5 minutes)

Update `server/learning-server.js`:

```javascript
app.use(cors({
    origin: [
        'http://localhost:8000',
        'https://your-frontend-url.vercel.app',  // If using Vercel
        'https://your-frontend.up.railway.app',   // If using Railway
    ],
    credentials: true
}));
```

---

#### **Step 8: Test Deployment** (15 minutes)

1. **Check Backend Health**:
   ```bash
   curl https://your-backend.up.railway.app/api/health
   ```

   Expected response:
   ```json
   {
     "status": "ok",
     "timestamp": "...",
     "server": "learning-api"
   }
   ```

2. **Test Frontend**:
   - Open: `https://your-frontend-url`
   - Check server connection status
   - Try uploading a test transcript
   - Verify AI analysis works

3. **Check Logs**:
   - Railway → Your Service → Logs tab
   - Look for errors or warnings
   - Verify API calls succeed

---

#### **Step 9: Custom Domain** (Optional, 15 minutes)

1. **Add Your Domain**:
   - Railway → Settings → Domains
   - Add custom domain: `analyzer.your-domain.com`

2. **Configure DNS**:
   - Add CNAME record:
   ```
   Type: CNAME
   Name: analyzer
   Value: your-app.up.railway.app
   ```

3. **SSL Certificate**:
   - Railway auto-provisions Let's Encrypt SSL
   - HTTPS enabled automatically

---

## 📁 Required Files for Deployment

### 1. Update `package.json`

```json
{
  "name": "hkit-course-analyzer",
  "version": "2.0.0",
  "description": "HKIT Course Analyzer with Gemini 2.5 Flash",
  "main": "server/learning-server.js",
  "scripts": {
    "start": "node server/learning-server.js",
    "dev": "nodemon server/learning-server.js",
    "test": "jest"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },
  "dependencies": {
    "@google/generative-ai": "^0.21.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2",
    "dotenv": "^17.2.2",
    "pg": "^8.16.3"
  }
}
```

### 2. Create `railway.json` (Railway Config)

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100
  }
}
```

### 3. Create `Procfile` (Alternative Start Config)

```
web: node server/learning-server.js
```

### 4. Update `.gitignore`

Ensure these are ignored:
```
.env
.env.local
node_modules/
*.log
.DS_Store
```

---

## 🔧 Environment Variables Guide

### Backend Service Variables

```bash
# Required
NODE_ENV=production
PORT=3001
GEMINI_API_KEY=AIza...your...key

# Learning Database (Optional)
LEARNING_ENABLED=true
DB_HOST=your-db-host.railway.internal
DB_PORT=5432
DB_NAME=railway
DB_USER=postgres
DB_PASSWORD=...
DATABASE_URL=postgresql://...

# Server Config
LEARNING_SERVER_PORT=3001
```

### Frontend Variables (if using build process)

```bash
VITE_API_URL=https://your-backend.up.railway.app
VITE_ENV=production
```

---

## 💰 Cost Estimation

### Railway (Recommended)

**Backend Service**:
- Base: ~$5/month
- With database: ~$10/month
- With high traffic: ~$15/month

**Included**:
- Automatic HTTPS
- PostgreSQL database
- Unlimited bandwidth
- No timeout limits

### Total Monthly Cost: $5-15

---

## 🔐 Security Checklist

- [ ] API key stored in environment variables (not in code)
- [ ] `.env` file in `.gitignore`
- [ ] CORS configured for specific domains only
- [ ] HTTPS enabled (Railway does this automatically)
- [ ] Database credentials not exposed
- [ ] Rate limiting implemented (optional)
- [ ] Input validation on backend
- [ ] Error messages don't expose sensitive info

---

## 🎯 Post-Deployment Tasks

### 1. Monitor Performance
- Set up Railway alerts
- Monitor API usage and costs
- Track error rates

### 2. User Testing
- Share URL with test users
- Collect feedback
- Monitor for issues

### 3. Documentation
- Update README with production URL
- Document API endpoints
- Create user guide

### 4. Backup Strategy
- Export database regularly
- Keep local backup of code
- Document restore procedures

---

## 🐛 Troubleshooting Guide

### Issue: "Cannot connect to backend server"

**Solutions**:
1. Check Railway service is running
2. Verify environment variables are set
3. Check logs for startup errors
4. Verify CORS settings

### Issue: "Gemini API key not configured"

**Solutions**:
1. Check `GEMINI_API_KEY` in Railway variables
2. Restart the service after adding variable
3. Verify key is valid in Google AI Studio

### Issue: "Database connection failed"

**Solutions**:
1. Check PostgreSQL service is running
2. Verify connection string is correct
3. Check database credentials
4. Test connection from Railway console

### Issue: "Frontend can't reach backend"

**Solutions**:
1. Check backend URL in frontend code
2. Verify CORS settings allow frontend domain
3. Check network tab in browser DevTools
4. Ensure backend service is public (not internal)

---

## 📞 Support Resources

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Google Gemini API**: https://ai.google.dev/docs
- **Project Docs**: `/docs` folder in repository

---

## 🎓 Alternative: Simplified Deployment

### If You Want Something Simpler

**Option**: Deploy Backend Only to Railway, Keep Frontend Local

**Steps**:
1. Deploy only `server/` folder to Railway
2. Keep using `local/enhanced.html` on local machines
3. Update frontend to point to Railway backend URL
4. Share frontend HTML file with users

**Pros**:
- Simpler setup
- Lower cost ($5/month)
- Faster deployment

**Cons**:
- Users need to run local server
- Not a true web application

---

## 📊 Success Metrics

After deployment, verify:

- [ ] Frontend loads at public URL
- [ ] Backend health check responds
- [ ] Server connection status shows green
- [ ] Can upload and analyze transcript
- [ ] AI analysis completes successfully
- [ ] Results export works
- [ ] No console errors
- [ ] Response time < 5s for analysis

---

## 🚀 Ready to Deploy?

**Recommended Path**:
1. Start with Railway (most straightforward)
2. Deploy backend service first
3. Test API endpoints
4. Deploy frontend second
5. Connect everything
6. Test end-to-end

**Estimated Timeline**:
- Preparation: 30 minutes
- Backend deployment: 45 minutes
- Frontend deployment: 30 minutes
- Testing & fixes: 45 minutes
- **Total: 2-3 hours**

---

**Need Help?** Let me know which deployment option you want to pursue, and I can create the specific configuration files and guide you through it step by step!
