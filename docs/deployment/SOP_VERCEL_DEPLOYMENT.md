# Standard Operating Procedure: Vercel Deployment

## Document Information
- **Version**: 1.0
- **Last Updated**: September 3, 2025
- **Author**: Claude Code Assistant
- **Project**: HKIT Course Analyzer Enhanced UI

## Overview
This SOP documents the complete deployment process for the HKIT Course Analyzer Enhanced UI to Vercel, including all problems encountered and their solutions.

---

## Prerequisites

### Required Accounts & Services
- [x] **GitHub Account** with repository access
- [x] **Vercel Account** (free tier acceptable)
- [x] **Google Cloud Account** with Gemini API access
- [x] **Valid Gemini API Key** (starts with `AIza...`)

### Required Files Structure
```
project-root/
├── index.html (Enhanced UI version)
├── vercel.json (Deployment configuration)
├── package.json (Dependencies)
├── api/
│   ├── gemini.js (Main API endpoint)
│   ├── gemini-chunked.js (Chunked processing)
│   ├── gemini-status.js (Status checking)
│   └── package.json (API-specific dependencies)
├── assets/ (Frontend assets)
├── config/ (Configuration files)
└── docs/ (Documentation)
```

---

## Deployment Steps

### Step 1: Prepare Repository
1. **Backup Current Version**
   ```bash
   cp index.html index-basic-backup.html
   cp -r assets/ assets-basic-backup/
   ```

2. **Deploy Enhanced Version**
   - Copy enhanced UI files to root directory
   - Update asset paths to remove `local/` prefix
   - Ensure all modules are in correct locations

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "🚀 Deploy Enhanced Version to Production"
   git push origin main
   ```

### Step 2: Configure Vercel Project

#### 2.1 Create New Project
1. Visit [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import Git Repository
4. Select your GitHub repository

#### 2.2 Project Settings
- **Framework Preset**: Other
- **Root Directory**: `./` (leave default)
- **Build Command**: `npm install`
- **Output Directory**: `.`
- **Install Command**: `npm install`

#### 2.3 Environment Variables (Critical!)
**Required Variables:**
| Name | Value | Environment |
|------|--------|-------------|
| `GEMINI_API_KEY` | Your actual API key (AIza...) | ✅ Production ✅ Preview ✅ Development |
| `NODE_ENV` | `production` | ✅ Production |

### Step 3: Configure vercel.json
Ensure your `vercel.json` contains:

```json
{
  "buildCommand": "npm install",
  "outputDirectory": ".",
  "framework": null,
  "functions": {
    "api/gemini.js": {
      "maxDuration": 10
    },
    "api/gemini-chunked.js": {
      "maxDuration": 10
    },
    "api/gemini-status.js": {
      "maxDuration": 5
    },
    "api/*.js": {
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type"
        },
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "DEPLOYMENT_REGION": "us-east"
  },
  "regions": [
    "iad1"
  ]
}
```

### Step 4: Deploy
1. Click "Deploy" in Vercel dashboard
2. Wait for build completion (2-3 minutes)
3. Note the deployment URL

---

## Common Problems & Solutions

### Problem 1: 404 NOT_FOUND Error
**Symptom:** `404: NOT_FOUND` when accessing the app

**Root Cause:** API files in wrong directory or conflicting routes

**Solution:**
1. Ensure API files are in `/api` directory (not `/src/api`)
2. Remove conflicting `routes` configuration from `vercel.json`
3. Vercel cannot have both `routes` and `headers` configurations

**Code Fix:**
```bash
# Move API files to correct location
cp src/api/*.js api/
# Remove routes section from vercel.json
```

### Problem 2: Geographic Restrictions Error
**Symptom:** `[400 Bad Request] User location is not supported for the API use`

**Root Cause:** Vercel functions running from unsupported region (Hong Kong)

**Geographic Context:**
- **Singapore-based Google Accounts**: May have regional API restrictions
- **Hong Kong Region (hkg1)**: Not supported for Gemini API
- **US Regions**: Full Gemini API support

**Solution:**
1. **Change Vercel Region** in `vercel.json`:
   ```json
   "regions": ["iad1"]
   ```
2. **Force Deployment** to apply new region
3. **Test from US region** if needed

**Alternative:** Use Local Mode (bypasses geographic restrictions)

### Problem 3: Missing Dependencies Error
**Symptom:** `Module not found: @google/generative-ai`

**Root Cause:** Vercel functions don't have access to required dependencies

**Solution:**
1. **Add build command** to `vercel.json`:
   ```json
   "buildCommand": "npm install"
   ```
2. **Create API-specific package.json**:
   ```json
   // api/package.json
   {
     "dependencies": {
       "@google/generative-ai": "^0.21.0"
     }
   }
   ```

### Problem 4: Timeout Errors (9-10 seconds)
**Symptom:** `Request timeout - please try again with shorter input`

**Root Cause:** Vercel Free Plan has 10-second hard limit per function

**Solution Options:**
1. **Use Local Mode** (Recommended)
   - No timeout limitations
   - Faster processing
   - Better for large files

2. **Optimize for Small Files**
   - Use `gemini-1.5-flash` for speed
   - Lower temperature (0.3)
   - Reduce prompt complexity

3. **Implement Chunked Processing**
   - Split large files into chunks
   - Process incrementally
   - Use status polling

### Problem 5: API Key Not Found
**Symptom:** `GEMINI_API_KEY not configured`

**Root Cause:** Environment variable not set or not applied

**Solution:**
1. **Verify Environment Variable** in Vercel Dashboard
2. **Redeploy after setting** environment variables
3. **Check API key format** (must start with `AIza`)

---

## Testing Procedures

### Test 1: Basic Connectivity
1. Visit deployed URL
2. Check for Enhanced UI elements:
   - API key configuration section
   - Student information forms
   - Enhanced badge "🚀 ENHANCED MODE"

### Test 2: Server Mode (Small Files)
1. Upload small PDF (1-2 pages)
2. Select programme
3. Click "Analyze Files"
4. Expected: Success within 10 seconds

### Test 3: Local Mode (Large Files)
1. Click API key section
2. Enter Gemini API key
3. Save key
4. Upload large PDF
5. Expected: Success with no timeout

### Test 4: Error Handling
1. Try without API key → Should show clear error
2. Try with invalid API key → Should show authentication error
3. Try with very large file → Should suggest local mode

---

## Maintenance

### Regular Checks
- [ ] **Monthly**: Verify API key validity
- [ ] **Quarterly**: Update dependencies in package.json
- [ ] **As Needed**: Monitor Vercel function logs
- [ ] **As Needed**: Check Google Cloud billing/quotas

### Updates
1. **Code Updates**: Push to GitHub (auto-deploys)
2. **Environment Variables**: Update via Vercel Dashboard
3. **Dependencies**: Update package.json and redeploy

---

## Troubleshooting Commands

### Debug API Issues
```bash
# Check Vercel function logs
# Go to Vercel Dashboard → Functions → View Logs

# Test API endpoint directly
curl -X POST https://your-app.vercel.app/api/gemini \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test"}'
```

### Local Development
```bash
# Test locally before deployment
npm install
npx vercel dev

# Or simple HTTP server
python -m http.server 8000
```

---

## Success Criteria

### Deployment Success Indicators
- [x] ✅ App loads without 404 errors
- [x] ✅ Enhanced UI features visible
- [x] ✅ API endpoints respond (not 500 errors)
- [x] ✅ Local mode works for all file sizes
- [x] ✅ Server mode works for small files
- [x] ✅ Geographic restrictions bypassed

### Performance Benchmarks
- **Small Files (<500KB)**: Server mode success rate >90%
- **Large Files (>2MB)**: Local mode success rate >99%
- **Response Time**: <10 seconds for server mode
- **Error Rate**: <1% for properly configured system

---

## Contact Information

### Support Resources
- **Vercel Documentation**: https://vercel.com/docs
- **Google Cloud Console**: https://console.cloud.google.com
- **GitHub Repository**: [Your Repository URL]

### Escalation Path
1. **Check this SOP** for known solutions
2. **Review Vercel function logs** for specific errors
3. **Test local mode** as workaround
4. **Contact development team** with specific error messages

---

## Appendix

### A. Supported Vercel Regions
- `iad1` - Washington, D.C. (US East) ✅ Recommended
- `sfo1` - San Francisco (US West) ✅ Alternative
- `hkg1` - Hong Kong ❌ Not supported for Gemini API

### B. Google Cloud Regions with Gemini Support
- US regions: Full support
- EU regions: Full support
- Asia-Pacific: Limited support (varies by country)
- Singapore: May have restrictions for certain Google accounts

### C. File Size Recommendations
- **Vercel Server Mode**: <1MB PDF, <500KB optimal
- **Local Mode**: No practical limits (tested up to 20MB)
- **Chunked Processing**: 1-10MB (future enhancement)

---

**Document End**

*This SOP should be updated whenever deployment procedures change or new issues are discovered.*