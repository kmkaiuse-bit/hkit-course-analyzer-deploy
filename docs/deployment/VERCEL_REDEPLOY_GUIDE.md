# 🚀 Vercel Redeployment Guide - HKIT Course Analyzer

## Overview
This guide covers how to redeploy the HKIT Course Analyzer on Vercel when needed (e.g., configuration issues, migration, or cleanup).

**Current Production URL**: https://hkit-course-analyzer-deploy.vercel.app/

---

## When to Redeploy

You should redeploy when:
- ❌ Deployment configuration is corrupted
- 🔧 Major configuration changes are needed
- 🆕 Migrating to a new Vercel account
- 🧹 Cleaning up old test deployments

**Note**: Normal code updates do NOT require redeployment - Vercel auto-deploys on every git push.

---

## Prerequisites

✅ GitHub repository: `hkit-course-analyzer-deploy` (main branch)
✅ Vercel account with access rights
✅ Supabase project credentials (if using database features)
✅ Google Gemini API key configured in application

---

## Step 1: Delete Current Vercel Project (Optional)

**⚠️ Only do this if you need a clean slate**

1. Login to [Vercel Dashboard](https://vercel.com/dashboard)
2. Find your `hkit-course-analyzer-deploy` project
3. Click project → **Settings**
4. Scroll to bottom → **Delete Project**
5. Confirm deletion

---

## Step 2: Import Project from GitHub

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New...** → **Project**
3. Find `hkit-course-analyzer-deploy` repository
4. Click **Import**

---

## Step 3: Configure Deployment Settings

### Framework & Build Settings

**Important**: This is a **static site** with no build process

- **Framework Preset**: `Other` (no framework)
- **Root Directory**: `.` (leave empty/default)
- **Build Command**: Leave empty
- **Output Directory**: Leave empty
- **Install Command**: Leave empty
- **Node.js Version**: 18.x or 20.x

### Git Branch Selection

- **Branch**: `main` ✅
- **Auto-deploy**: Enabled (default)

---

## Step 4: Configure Environment Variables

**For current setup, NO environment variables are required on Vercel.**

Why?
- ✅ Gemini API key is configured in the application code
- ✅ Supabase credentials are in client-side config files (safe for public use)
- ✅ All processing happens client-side in the browser

**If you want to add Supabase integration tracking (optional)**:
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://[your-project-id].supabase.co
Environment: Production, Preview, Development

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: [your-supabase-anon-key]
Environment: Production, Preview, Development
```

---

## Step 5: Deploy

1. Review all settings
2. Click **Deploy**
3. Wait 1-2 minutes for deployment to complete
4. Note your production URL (e.g., `https://hkit-course-analyzer-deploy.vercel.app/`)

---

## Step 6: Verify Deployment

### Verification Checklist

1. **Basic Access**
   - [ ] Visit production URL
   - [ ] Page loads without errors
   - [ ] No 404 or 500 errors

2. **Core Functionality**
   - [ ] Upload PDF file works
   - [ ] Programme selection dropdown populated
   - [ ] "Analyze Files" button visible
   - [ ] Student information form visible

3. **AI Analysis**
   - [ ] Fill in student information
   - [ ] Upload sample transcript
   - [ ] Click "Analyze Files"
   - [ ] Analysis completes successfully
   - [ ] Results display correctly

4. **Database Features** (if Supabase configured)
   - [ ] Complete analysis
   - [ ] "💾 Save to Database" button appears
   - [ ] Click save → confirmation dialog appears
   - [ ] Confirm → success message
   - [ ] Check Supabase Table Editor for saved data

---

## Troubleshooting

### Problem: 404 Not Found

**Cause**: Wrong root directory or build settings

**Solution**:
1. Go to Project Settings → General
2. Ensure Root Directory is empty or `.`
3. Redeploy

### Problem: Files Not Loading

**Cause**: Incorrect file paths or routing

**Solution**:
1. Check `vercel.json` exists in root with correct configuration
2. Verify all asset paths are relative (e.g., `./assets/css/style.css`)
3. Clear browser cache and retry

### Problem: Supabase Connection Failed

**Cause**: Incorrect Supabase credentials in config files

**Solution**:
1. Check `config/supabase-config.js` has correct:
   - Project URL: `https://[project-id].supabase.co`
   - Anon key: `eyJhbGci...` (starts with eyJ)
2. Verify Supabase project is active (not paused)
3. Check Supabase RLS policies allow public access for anon key

### Problem: API Analysis Not Working

**Cause**: Gemini API key not configured in application OR API quota exceeded

**Solution**:
1. Verify Gemini API key is properly configured in application code
2. Check API quota limits at: https://makersuite.google.com
3. Check browser console for specific error messages
4. For large PDFs, analysis may take 30-60 seconds

---

## Post-Deployment Tasks

1. **Update Documentation**
   - [ ] Update production URL in README.md (if changed)
   - [ ] Update any hardcoded URLs in documentation

2. **Test Supabase Integration**
   - [ ] Perform test analysis and save to database
   - [ ] Verify data appears in Supabase Table Editor
   - [ ] Check learning patterns are being recorded

3. **Notify Users** (if URL changed)
   - [ ] Email updated URL to staff
   - [ ] Update bookmarks/shortcuts
   - [ ] Update any training materials

---

## Auto-Deployment Workflow

After initial setup, **you don't need to manually redeploy**.

Every time you push to GitHub:
```bash
git add .
git commit -m "Your update message"
git push origin main
```

Vercel automatically:
1. Detects the push
2. Builds and deploys
3. Updates production site (1-2 minutes)

---

## Emergency Rollback

If a deployment breaks the site:

1. Go to Vercel Dashboard → Your Project
2. Click **Deployments** tab
3. Find last working deployment
4. Click **•••** menu → **Promote to Production**
5. Site immediately reverts to that version

---

## Configuration Files Reference

### vercel.json
Located in project root. Key settings:
```json
{
  "cleanUrls": true,
  "trailingSlash": false
}
```

### config/supabase-config.js
Supabase connection settings (client-side, safe to commit):
```javascript
const SUPABASE_CONFIG = {
    url: 'https://your-project.supabase.co',
    anonKey: 'your-anon-key',
    enabled: true
};
```

---

## Support Resources

- **Vercel Documentation**: https://vercel.com/docs
- **GitHub Repository**: https://github.com/kmkaiuse-bit/hkit-course-analyzer-deploy
- **Supabase Setup Guide**: See `SUPABASE_VERCEL_SETUP_SOP.md`
- **Technical Support**: stevenkok@hkit.edu.hk

---

## Summary

**Current Architecture**:
- 📄 Static HTML/CSS/JS site
- ☁️ Deployed on Vercel
- 🔄 Auto-deploys from GitHub main branch
- 🗄️ Optional Supabase cloud database
- 🤖 Client-side Gemini AI processing (user provides key)

**Key Points**:
- ✅ No build process needed
- ✅ No server-side code
- ✅ No environment variables required (unless optional features)
- ✅ Auto-deploys on every git push
- ✅ Manual database saves (user confirms before saving)

---

**Document Version**: 2.0
**Last Updated**: November 3, 2025
**Status**: Production Ready
