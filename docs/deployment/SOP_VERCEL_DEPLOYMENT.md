# Standard Operating Procedure: Vercel Deployment

## Document Information
- **Version**: 2.0
- **Last Updated**: November 3, 2025
- **Author**: HKIT Development Team
- **Project**: HKIT Course Exemption Analyzer
- **Deployment Type**: Static Site (Client-Side Only)

---

## Overview

This SOP covers the standard deployment procedure for the HKIT Course Exemption Analyzer on Vercel. This is a **static site** with no server-side code, using client-side JavaScript for all functionality.

**Production URL**: https://hkit-course-analyzer-deploy.vercel.app/

---

## Architecture Summary

### Current Architecture (November 2025)
```
User Browser
    ↓
Static HTML/CSS/JS (Vercel CDN)
    ↓
Client-Side Processing:
    • PDF.js (PDF parsing)
    • Google Gemini AI (user's API key)
    • Supabase Client SDK (cloud database)
    ↓
External Services:
    • Google Gemini API (AI analysis)
    • Supabase (cloud PostgreSQL database)
```

### Key Characteristics
- ✅ **Static Site**: No build process, no server-side code
- ✅ **Client-Side Processing**: All logic runs in user's browser
- ✅ **No Environment Variables**: Users provide their own API keys
- ✅ **Auto-Deploy**: Every git push triggers deployment
- ✅ **Manual Database Saves**: User confirms before saving data

---

## Prerequisites

Before deployment, ensure you have:

1. **GitHub Repository Access**
   - Repository: `kmkaiuse-bit/hkit-course-analyzer-deploy`
   - Branch: `main`
   - Access: Write permissions

2. **Vercel Account**
   - Account: Active Vercel account
   - Permissions: Deploy access to project

3. **Supabase Setup** (Optional but recommended)
   - Active Supabase project
   - Database schema deployed
   - Credentials configured in `config/supabase-config.js`

4. **Test Credentials**
   - Google Gemini API key for testing
   - Sample transcript PDF files

---

## Deployment Procedure

### Initial Deployment (First Time)

#### Step 1: Connect GitHub Repository

1. Login to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New...** → **Project**
3. Select **Import Git Repository**
4. Choose `kmkaiuse-bit/hkit-course-analyzer-deploy`
5. Click **Import**

#### Step 2: Configure Project Settings

**Framework Preset**: `Other` (no framework)

**Root Directory**:
- Leave empty or set to `.`
- Do NOT set to any subdirectory

**Build Settings**:
- Build Command: *Leave empty*
- Output Directory: *Leave empty*
- Install Command: *Leave empty*

**Git Configuration**:
- Production Branch: `main`
- Enable Automatic Deployments: ✓ Yes

#### Step 3: Environment Variables

**For current architecture: NO environment variables needed**

The application:
- Does not use server-side environment variables
- Users provide their own Gemini API keys via UI
- Supabase credentials are in client-side config (safe for public)

#### Step 4: Deploy

1. Review all settings
2. Click **Deploy**
3. Wait for deployment (typically 1-2 minutes)
4. Verify deployment URL

---

### Continuous Deployment (Updates)

After initial setup, deployment is automatic:

```bash
# Make changes to code
git add .
git commit -m "Description of changes"
git push origin main
```

Vercel automatically:
1. Detects push to `main` branch
2. Deploys new version (1-2 minutes)
3. Updates production site
4. Keeps previous deployments for rollback

**No manual deployment steps needed for normal updates.**

---

## Configuration Files

### vercel.json (Project Root)

Location: `/vercel.json`

Current configuration:
```json
{
  "cleanUrls": true,
  "trailingSlash": false
}
```

**Purpose**:
- `cleanUrls`: Serves `/about` instead of `/about.html`
- `trailingSlash`: No trailing slashes in URLs

**When to modify**: Rarely - only for routing changes

---

### config/supabase-config.js

Location: `/config/supabase-config.js`

Contains Supabase connection settings:
```javascript
const SUPABASE_CONFIG = {
    url: 'https://[project-id].supabase.co',
    anonKey: 'eyJhbGci...',
    enabled: true
};
```

**Security Note**: The `anonKey` is safe to commit publicly - it's designed for client-side use and protected by Supabase Row Level Security (RLS).

**When to modify**: Only when changing Supabase project or credentials

---

## Testing Procedures

### Post-Deployment Testing Checklist

#### Test 1: Basic Site Access
```
✓ Visit: https://hkit-course-analyzer-deploy.vercel.app/
✓ Page loads without 404/500 errors
✓ UI displays correctly
✓ No console errors (F12 → Console)
```

#### Test 2: File Upload
```
✓ Click "Upload PDF" button
✓ Select test transcript PDF
✓ File appears in upload area
✓ Programme dropdown populates
```

#### Test 3: AI Analysis (Requires User API Key)
```
✓ Enter Google Gemini API key in settings
✓ Upload sample transcript
✓ Select programme
✓ Click "Analyze Files"
✓ Results display within 10-30 seconds
✓ Courses show exemption status
```

#### Test 4: Database Save (Supabase)
```
✓ Complete analysis successfully
✓ "💾 Save to Database" button appears
✓ Click button
✓ Confirmation dialog displays
✓ Confirm save
✓ Success notification appears
✓ Verify data in Supabase Table Editor
```

#### Test 5: Export Features
```
✓ Click "Export to CSV"
✓ CSV file downloads
✓ Click "Export to Excel"
✓ Excel file downloads
✓ Click "Export to PDF"
✓ PDF file downloads
```

---

## Common Issues & Solutions

### Issue 1: 404 Page Not Found

**Symptoms**:
- Accessing site shows "404: NOT_FOUND"
- Page doesn't load

**Causes**:
- Incorrect root directory setting
- Missing `index.html` in root
- Incorrect vercel.json configuration

**Solutions**:
1. Check Vercel Project Settings → General → Root Directory (should be empty or `.`)
2. Verify `index.html` exists in repository root
3. Check `vercel.json` is valid JSON
4. Redeploy from Vercel dashboard

---

### Issue 2: Files Not Loading (CSS/JS)

**Symptoms**:
- Page loads but looks broken (no styling)
- Console shows 404 errors for CSS/JS files

**Causes**:
- Incorrect file paths in HTML
- Files not committed to repository
- Caching issues

**Solutions**:
1. Verify all asset paths are relative: `./assets/css/style.css`
2. Check files exist in repository on GitHub
3. Clear browser cache (Ctrl+Shift+Delete)
4. Check Vercel deployment logs for build errors

---

### Issue 3: Supabase Connection Failed

**Symptoms**:
- "Cloud database connection failed" notification
- "Save to Database" fails
- Console shows Supabase errors

**Causes**:
- Incorrect Supabase credentials
- Supabase project paused/inactive
- Network connectivity issues
- RLS policy issues

**Solutions**:
1. Verify credentials in `config/supabase-config.js`:
   ```javascript
   url: 'https://[correct-project-id].supabase.co',
   anonKey: 'eyJhbGci...' // Must start with eyJ
   ```
2. Check Supabase project is active (not paused) at https://supabase.com/dashboard
3. Verify RLS policies allow anon access for required tables
4. Check browser console for specific error messages
5. Test Supabase connection directly via SQL Editor

---

### Issue 4: AI Analysis Not Working

**Symptoms**:
- "Analyze Files" button does nothing
- Error: "API key not configured"
- Analysis fails with timeout

**Causes**:
- User hasn't entered Gemini API key
- Invalid/expired API key
- Large PDF file causing timeout
- Network issues

**Solutions**:
1. **User-side issue**: Ensure user has entered valid Gemini API key
2. Guide user to get key: https://makersuite.google.com/app/apikey
3. For large PDFs: May take 30-60 seconds, be patient
4. Check browser console for specific errors
5. Try smaller test PDF first

---

### Issue 5: Auto-Deploy Not Working

**Symptoms**:
- Git push doesn't trigger deployment
- Changes not appearing on production site

**Causes**:
- Wrong branch pushed
- Vercel GitHub integration disconnected
- Deployment paused in Vercel

**Solutions**:
1. Verify pushing to `main` branch: `git branch` (should show `* main`)
2. Check Vercel Dashboard → Project → Git:
   - GitHub connection status
   - Auto-deploy enabled
3. Manual deploy: Vercel Dashboard → Deployments → Redeploy
4. Check GitHub Actions aren't blocking push

---

## Rollback Procedures

### When to Rollback

Rollback to previous deployment if:
- New deployment breaks critical functionality
- Serious bugs discovered after deployment
- Incorrect configuration deployed

### How to Rollback

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click **Deployments** tab
4. Find last working deployment (green checkmark)
5. Click **•••** menu on that deployment
6. Select **Promote to Production**
7. Confirm promotion

**Effect**: Site immediately reverts to selected deployment (instant rollback)

---

## Monitoring & Maintenance

### Daily Checks (Automated)
- Vercel monitors uptime automatically
- GitHub Actions (if configured) run tests

### Weekly Manual Checks
- [ ] Verify production site loads correctly
- [ ] Test one sample analysis end-to-end
- [ ] Check Supabase database for new data
- [ ] Review Vercel analytics for usage patterns

### Monthly Maintenance
- [ ] Review Vercel deployment logs for errors
- [ ] Check Supabase database performance
- [ ] Verify API quotas not exceeded (Google Gemini)
- [ ] Update dependencies if security patches available
- [ ] Backup Supabase database

---

## Performance Benchmarks

### Expected Performance

**Site Load Time**:
- First load: < 3 seconds
- Cached load: < 1 second

**AI Analysis Time** (varies by PDF size):
- Small PDF (1-3 pages): 5-15 seconds
- Medium PDF (4-10 pages): 15-30 seconds
- Large PDF (10+ pages): 30-60 seconds

**Database Save Time**:
- Typical: < 2 seconds
- During high load: < 5 seconds

**File Export Time**:
- CSV: < 1 second
- Excel: < 2 seconds
- PDF: < 3 seconds

---

## Security Considerations

### Client-Side Security
- ✅ User API keys stored in localStorage (user's device only)
- ✅ No API keys transmitted to Vercel servers
- ✅ Supabase anon key is rate-limited and RLS-protected
- ✅ HTTPS enforced by Vercel

### Database Security
- ✅ Row Level Security (RLS) policies on all Supabase tables
- ✅ Anon key has limited permissions
- ✅ No service role key exposed client-side
- ✅ Audit log tracks all database changes

### Best Practices
- 🔐 Never commit service role keys to repository
- 🔐 Use environment variables for sensitive server-side configs (if added later)
- 🔐 Regular security audits of dependencies
- 🔐 Keep Supabase RLS policies restrictive

---

## Support & Escalation

### Self-Service Resources
1. Check this SOP first
2. Review Vercel deployment logs
3. Check Supabase database logs
4. Review browser console errors
5. Test with sample data

### Technical Support Contacts
- **Technical Lead**: stevenkok@hkit.edu.hk
- **Vercel Documentation**: https://vercel.com/docs
- **Supabase Documentation**: https://supabase.com/docs
- **GitHub Issues**: https://github.com/kmkaiuse-bit/hkit-course-analyzer-deploy/issues

### Escalation Path
1. **Level 1**: Check documentation and logs
2. **Level 2**: Email technical support with error details
3. **Level 3**: Create GitHub issue with reproduction steps
4. **Level 4**: Emergency contact for production outages

---

## Appendices

### Appendix A: File Structure

```
hkit-course-analyzer-deploy/
├── index.html                  # Main application entry point
├── vercel.json                 # Vercel configuration
├── assets/
│   ├── css/                   # Stylesheets
│   ├── js/                    # JavaScript modules
│   │   ├── app.js            # Main application logic
│   │   ├── gemini-api.js     # Gemini AI integration
│   │   ├── supabase-client.js # Supabase client
│   │   └── modules/          # Feature modules
│   └── images/               # Static images
├── config/
│   ├── supabase-config.js    # Supabase credentials
│   └── programmes/           # Programme course data
├── docs/
│   └── deployment/           # This SOP and guides
├── db/
│   └── migrations/           # Database schema files
└── local/
    └── enhanced.html         # Local development version
```

### Appendix B: Useful Commands

```bash
# Check current git branch
git branch

# Switch to main branch
git checkout main

# Pull latest changes
git pull origin main

# View deployment status
# (Visit Vercel Dashboard)

# Clear browser cache
# Ctrl+Shift+Delete (Windows/Linux)
# Cmd+Shift+Delete (Mac)

# View browser console errors
# F12 → Console tab
```

### Appendix C: Emergency Contacts

**Production Outage**:
1. Check Vercel status: https://vercel.com/status
2. Rollback to last working deployment
3. Notify technical lead immediately
4. Create incident report

**Data Loss Concern**:
1. Do NOT make further changes
2. Contact technical lead immediately
3. Check Supabase backup system
4. Restore from most recent backup

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 2.0 | 2025-11-03 | HKIT Dev Team | Complete rewrite for static site architecture |
| 1.0 | 2025-09-03 | Claude Code | Initial version (deprecated) |

---

## Approval

This SOP has been reviewed and approved for:
- ✅ Accuracy of deployment procedures
- ✅ Completeness of troubleshooting steps
- ✅ Security considerations
- ✅ Alignment with current production architecture

**Status**: Production Ready
**Next Review Date**: March 2026

---

**Document End**

*This SOP should be updated whenever deployment procedures change or new issues are discovered.*
