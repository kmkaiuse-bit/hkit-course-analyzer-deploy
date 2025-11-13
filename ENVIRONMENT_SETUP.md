# Environment Setup Guide

**Last Updated:** 2025-01-05
**Version:** 1.0
**Status:** Production-ready after environment separation

---

## Table of Contents

1. [Overview](#overview)
2. [Production Environment Setup](#production-environment-setup)
3. [Testing Environment Setup](#testing-environment-setup)
4. [Environment Variable Reference](#environment-variable-reference)
5. [Provider Switching Guide](#provider-switching-guide)
6. [Troubleshooting](#troubleshooting)
7. [Security Best Practices](#security-best-practices)

---

## Overview

This project uses **separate configurations** for production and testing environments:

- **Production Environment**: Uses Gemini API via Vercel serverless functions (stable, secure)
- **Testing Environment**: Uses OpenRouter API for experimentation (local only)

### Architecture

```
Production (Vercel)           Testing (Local)
      |                             |
      ├─ index.html                 ├─ local/enhanced.html
      ├─ api-config.production.js   ├─ api-config.testing.js
      ├─ Vercel Functions           ├─ Local backend server
      └─ Gemini API (server-side)   └─ OpenRouter API (client/server)
```

### Key Principles

- ✅ **Production uses server-side API keys only** (secure)
- ✅ **Testing uses client-side keys** (local development only)
- ✅ **Complete environment isolation** (no mixing)
- ✅ **Template files in git** (no real keys committed)

---

## Production Environment Setup

### Prerequisites

- Vercel account
- Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
- Git repository connected to Vercel

### Step 1: Generate Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key (starts with `AIza...`)
5. **IMPORTANT**: Store this key securely - you'll only see it once

### Step 2: Configure Vercel Environment Variables

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `hkit-course-analyzer`
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `GEMINI_API_KEY` | `your_gemini_api_key_here` | Production, Preview |
| `API_MODE` | `backend` | Production, Preview |
| `NODE_ENV` | `production` | Production |

5. Click "Save"

### Step 3: Deploy to Production

```bash
# Ensure you're on the main branch
git checkout main

# Verify production config is in place
cat config/api-config.production.js

# Commit any pending security fixes
git add .gitignore backup/ SECURITY_AUDIT_2025-01-05.md
git commit -m "security: Complete environment separation and security audit"

# Push to trigger deployment
git push origin main
```

### Step 4: Verify Production Deployment

1. Wait for Vercel deployment to complete
2. Visit your production URL: `https://your-app.vercel.app`
3. Test basic functionality:
   - Upload a PDF transcript
   - Click "Analyze Transcript"
   - Verify analysis completes successfully
   - Check exemption results are accurate

4. Check Vercel logs for errors:
   - Go to Vercel Dashboard → Deployments → Latest → Functions
   - Look for any errors in `/api/gemini` function logs

### Production File Structure

```
config/
├── api-config.production.js  ← Loaded by index.html
├── api-config.js              ← Copy of production config (for Vercel)
└── client-api-config.template.js

api/
├── gemini.js                  ← Uses process.env.GEMINI_API_KEY
├── gemini-chunked.js
└── gemini-upload.js

index.html                     ← Production entry point
```

### Production Security Checklist

- [ ] Gemini API key added to Vercel Dashboard
- [ ] Environment variables set to "Production" scope
- [ ] No API keys in client-side code
- [ ] `config/client-api-config.js` in `.gitignore`
- [ ] Production deployment tested and working

---

## Testing Environment Setup

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- OpenRouter API key (optional, for OpenRouter testing)
- Local backend server running (for backend mode)

### Step 1: Clone and Install

```bash
# Clone repository
git clone https://github.com/your-username/hkit-course-analyzer.git
cd hkit-course-analyzer

# Install dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### Step 2: Configure Environment Variables (Optional)

Create `.env.local` for testing environment:

```bash
# Copy template
cp .env.local.example .env.local

# Edit with your preferred editor
notepad .env.local  # Windows
# or
nano .env.local     # macOS/Linux
```

Add your OpenRouter API key:

```env
# OpenRouter API (Testing Only)
OPENROUTER_API_KEY=sk-or-v1-your-key-here
API_PROVIDER=openrouter
API_MODE=backend
NODE_ENV=development

# Learning Server
LEARNING_SERVER_PORT=3001
DATABASE_URL=postgresql://hkit_admin:your-password@localhost:5432/hkit_learning_db
```

### Step 3: Configure Client API Key (Frontend Mode Only)

If you want to test **without backend server** (frontend mode):

```bash
# Copy client config template
cp config/client-api-config.template.js config/client-api-config.js

# Edit the file
notepad config/client-api-config.js
```

Update with your API key:

```javascript
const CLIENT_API_CONFIG = {
    // === OPENROUTER API (Testing Provider) ===
    OPENROUTER_API_KEY: 'sk-or-v1-your-actual-key-here',

    // Model configuration
    MODEL: 'google/gemini-2.5-pro',
    TEMPERATURE: 0.3,
    MAX_OUTPUT_TOKENS: 16384
};
```

**SECURITY WARNING**: This file is in `.gitignore` and should NEVER be committed to git.

### Step 4: Start Testing Environment

#### Option A: Backend Mode (Recommended)

```bash
# Terminal 1: Start backend server
npm run server

# Terminal 2: Start local development server (if needed)
python -m http.server 8000
# or
npx serve .

# Open testing environment
start local/enhanced.html
# or manually open: http://localhost:8000/local/enhanced.html
```

#### Option B: Frontend Mode (Direct API Calls)

```bash
# Just open the HTML file directly
start local/enhanced.html

# The app will detect no backend and use frontend mode automatically
```

### Step 5: Verify Testing Environment

1. Open `local/enhanced.html` in browser
2. Check browser console for environment indicator:
   ```
   🧪 TESTING ENVIRONMENT: OpenRouter API
   🔌 Backend detected: [true/false]
   ```

3. Test functionality:
   - Upload a PDF transcript
   - Click "Analyze Transcript"
   - Verify OpenRouter API is being called
   - Check results are correct

### Testing File Structure

```
local/
├── enhanced.html              ← Testing entry point
├── assets/
│   ├── js/
│   │   ├── gemini-api.js      ← Uses api-config.testing.js
│   │   └── utils.js
│   └── css/
└── config/
    └── api-config-smart.js    ← Smart mode detector (optional)

config/
├── api-config.testing.js      ← Loaded by enhanced.html
└── client-api-config.js       ← Your local key (gitignored)

server/
└── learning-server.js         ← Backend server (port 3001)
```

### Testing Security Checklist

- [ ] `.env.local` created and configured
- [ ] `config/client-api-config.js` in `.gitignore`
- [ ] No production keys used in testing
- [ ] Testing environment isolated from production
- [ ] Backend server running (for backend mode)

---

## Environment Variable Reference

### Production Variables (Vercel Dashboard)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | ✅ Yes | - | Gemini API key from Google AI Studio |
| `API_MODE` | No | `backend` | Always `backend` in production |
| `NODE_ENV` | No | `production` | Node environment |

### Testing Variables (.env.local)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENROUTER_API_KEY` | No | - | OpenRouter API key (optional) |
| `API_PROVIDER` | No | `gemini` | API provider: `gemini` or `openrouter` |
| `API_MODE` | No | `backend` | Mode: `backend` or `frontend` |
| `NODE_ENV` | No | `development` | Node environment |
| `LEARNING_SERVER_PORT` | No | `3001` | Backend server port |
| `DATABASE_URL` | No | - | PostgreSQL connection string |

### Client Configuration (client-api-config.js)

```javascript
const CLIENT_API_CONFIG = {
    // Gemini API (Production provider - for local testing only)
    GEMINI_API_KEY: 'AIza...',
    GEMINI_API_ENDPOINT: 'https://generativelanguage.googleapis.com/v1/models',

    // OpenRouter API (Testing provider)
    OPENROUTER_API_KEY: 'sk-or-v1-...',

    // Model configuration
    MODEL: 'google/gemini-2.5-pro',
    TEMPERATURE: 0.3,
    MAX_OUTPUT_TOKENS: 16384
};
```

---

## Provider Switching Guide

### Switching Between Environments

#### Production → Testing

```bash
# Open testing environment instead of production
start local/enhanced.html

# The config automatically loads api-config.testing.js
```

#### Testing → Production

```bash
# Deploy to Vercel
git push origin main

# Or test production config locally
start index.html  # Loads api-config.production.js
```

### Switching API Providers in Testing

#### Method 1: Environment Variable

Edit `.env.local`:

```env
# Use Gemini
API_PROVIDER=gemini

# Or use OpenRouter
API_PROVIDER=openrouter
```

#### Method 2: Config File

Edit `config/api-config.testing.js`:

```javascript
const API_CONFIG = {
    API_PROVIDER: 'openrouter',  // Change to 'gemini' or 'openrouter'
    // ...
};
```

#### Method 3: Smart Config (Advanced)

Use `local/config/api-config-smart.js` for automatic detection:

```html
<!-- In local/enhanced.html -->
<script src="../local/config/api-config-smart.js"></script>
```

This will auto-detect:
- Backend availability
- API provider from environment
- Fallback to frontend mode if backend unavailable

### Backend vs Frontend Mode

#### Backend Mode (Recommended)

- API calls go through local server (`http://localhost:3001`)
- Server handles API keys (more secure)
- Supports learning system and database features

```bash
npm run server  # Start backend first
```

#### Frontend Mode

- Direct API calls to OpenRouter/Gemini
- API key in client-side code (less secure)
- No backend features available

```javascript
// Automatically enabled when backend not detected
// No server needed, just open HTML file
```

---

## Troubleshooting

### Production Issues

#### Error: "Gemini API key not configured"

**Cause**: `GEMINI_API_KEY` not set in Vercel Dashboard

**Solution**:
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add `GEMINI_API_KEY` with your key
3. Redeploy the project

#### Error: "API call failed: 500"

**Cause**: Invalid or expired Gemini API key

**Solution**:
1. Generate new key at [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Update in Vercel Dashboard
3. Redeploy

#### Error: "Failed to fetch"

**Cause**: Vercel function timeout or network issue

**Solution**:
1. Check Vercel function logs
2. Verify PDF file size (< 4.5MB for Vercel)
3. Use chunked upload for large files

### Testing Issues

#### Error: "Backend not available"

**Cause**: Learning server not running

**Solution**:
```bash
# Start backend server
npm run server

# Verify it's running
curl http://localhost:3001/api/health
```

#### Error: "OpenRouter API key not found"

**Cause**: API key not configured

**Solution**:
- **Backend mode**: Add to `.env.local`
- **Frontend mode**: Add to `config/client-api-config.js`

#### Error: "CORS error"

**Cause**: Browser blocking cross-origin requests

**Solution**:
- Use backend mode instead of frontend mode
- Or run local server: `python -m http.server 8000`

#### Console shows "Production config" but in testing

**Cause**: Wrong config file loaded

**Solution**:
```html
<!-- In local/enhanced.html, verify: -->
<script src="../config/api-config.testing.js"></script>

<!-- NOT production config -->
```

### Database Issues

#### Error: "Database connection failed"

**Cause**: PostgreSQL not running or wrong credentials

**Solution**:
```bash
# Check PostgreSQL is running
"C:\Program Files\PostgreSQL\17\bin\psql" --version

# Verify database exists
"C:\Program Files\PostgreSQL\17\bin\psql" -U postgres -l

# Update DATABASE_URL in .env.local
DATABASE_URL=postgresql://hkit_admin:your-password@localhost:5432/hkit_learning_db
```

### Git Issues

#### Error: "Client-api-config.js still tracked"

**Cause**: File was committed before .gitignore

**Solution**:
```bash
# Remove from git tracking (keeps local file)
git rm --cached config/client-api-config.js

# Commit the removal
git commit -m "chore: Remove sensitive config from tracking"
```

---

## Security Best Practices

### DO ✅

- ✅ Use environment variables for production API keys
- ✅ Keep `config/client-api-config.js` in `.gitignore`
- ✅ Use server-side API keys in production (Vercel Functions)
- ✅ Generate separate API keys for production and testing
- ✅ Rotate keys if accidentally exposed
- ✅ Use template files (`.template.js`) in git
- ✅ Test with sample data first

### DON'T ❌

- ❌ Commit real API keys to git
- ❌ Use production keys in testing environment
- ❌ Use client-side API keys in production
- ❌ Share API keys in public channels
- ❌ Commit `.env` or `.env.local` files
- ❌ Mix production and testing configurations
- ❌ Skip security audits before deployment

### Key Rotation Process

If a key is exposed:

1. **Immediate**: Revoke the exposed key
   - Gemini: [Google AI Studio](https://aistudio.google.com/app/apikey) → Delete key
   - OpenRouter: [OpenRouter Dashboard](https://openrouter.ai/keys) → Revoke key

2. **Generate new key**: Create replacement key

3. **Update configuration**:
   - Production: Update Vercel environment variable
   - Testing: Update `.env.local` or `client-api-config.js`

4. **Clean git history** (if key was committed):
   ```bash
   # Use BFG Repo-Cleaner or git filter-branch
   # See: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository
   ```

5. **Verify**: Test both environments with new key

---

## Quick Reference

### Start Production
```bash
git push origin main  # Deploy to Vercel
```

### Start Testing (Backend Mode)
```bash
npm run server        # Terminal 1
start local/enhanced.html  # Terminal 2
```

### Start Testing (Frontend Mode)
```bash
start local/enhanced.html  # Direct API calls
```

### Check Configuration
```bash
# Production
cat config/api-config.production.js

# Testing
cat config/api-config.testing.js

# Environment variables
cat .env.local
```

### Verify Security
```bash
# Check .gitignore
git check-ignore -v config/client-api-config.js

# Scan for exposed keys
grep -r "AIza" .
grep -r "sk-or-v1" .

# List tracked files
git ls-files | grep config
```

---

## Additional Resources

- [Google AI Studio](https://aistudio.google.com/app/apikey) - Gemini API keys
- [OpenRouter Documentation](https://openrouter.ai/docs) - OpenRouter API docs
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables) - Vercel docs
- [Security Audit Report](./SECURITY_AUDIT_2025-01-05.md) - Latest security audit
- [Environment Separation Plan](./ENVIRONMENT_SEPARATION_PLAN.md) - Implementation plan

---

## Support

If you encounter issues not covered in this guide:

1. Check the [Security Audit Report](./SECURITY_AUDIT_2025-01-05.md)
2. Review [Environment Separation Plan](./ENVIRONMENT_SEPARATION_PLAN.md)
3. Check Vercel function logs (Production)
4. Check browser console (Testing)
5. Verify environment variables are set correctly

---

**Last Updated**: 2025-01-05
**Version**: 1.0
**Status**: Production-ready
