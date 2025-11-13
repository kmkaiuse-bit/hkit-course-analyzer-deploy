# Cloudflare Worker Setup - GitHub Integration (Easiest Method)

## 🚀 NEW: Deploy Directly from GitHub (Recommended)

Cloudflare now supports **automatic deployment from GitHub** - no manual code copying needed!

---

## Method 1: Direct GitHub Import (5 Minutes) ⭐ RECOMMENDED

### Step 1: Prepare Your Repository

Your worker code is already in your repo at `cloudflare-worker.js`. We just need to add a configuration file:

1. Create a file named `wrangler.toml` in your project root:

```toml
name = "hkit-analyzer"
main = "cloudflare-worker.js"
compatibility_date = "2025-01-13"

[env.production]
vars = { }

# Environment variables are set in Cloudflare dashboard
```

### Step 2: Connect to Cloudflare

1. Go to https://dash.cloudflare.com/
2. Sign up/login (free account)
3. Click **"Workers & Pages"** in left sidebar
4. Click **"Create application"**
5. Click **"Create Worker"**
6. Click **"Import a repository"** (or "Connect to Git")

### Step 3: Select Your Repository

1. Click **"Connect GitHub account"**
2. Authorize Cloudflare to access your repositories
3. Select your repository: `hkit-course-analyzer-deploy`
4. Choose branch: `main`
5. Click **"Continue"**

### Step 4: Configure Build Settings

Cloudflare will detect your `wrangler.toml` automatically:

- **Project name**: `hkit-analyzer` (auto-filled)
- **Build command**: Leave empty (not needed)
- **Build output directory**: Leave empty

Click **"Save and Deploy"**

### Step 5: Add Environment Variables

1. After deployment completes, you'll be in your worker dashboard
2. Click **"Settings"** tab
3. Scroll to **"Environment Variables"** section
4. Click **"Add variable"**
5. Add:
   - **Variable name**: `OPENROUTER_API_KEY`
   - **Value**: (paste your OpenRouter API key)
   - **Environment**: Select "Production"
6. Click **"Deploy"** to apply changes

### Step 6: Get Your Worker URL

1. Click **"Deployments"** tab
2. You'll see your live deployment
3. Copy the URL (looks like `https://hkit-analyzer.YOUR-SUBDOMAIN.workers.dev`)

### Step 7: Update Your App

1. Open `index.html` in your project
2. Find this line (around line 28):
   ```javascript
   window.CLOUDFLARE_WORKER_URL = '';
   ```
3. Update with your worker URL:
   ```javascript
   window.CLOUDFLARE_WORKER_URL = 'https://hkit-analyzer.YOUR-SUBDOMAIN.workers.dev';
   ```
4. Commit and push:
   ```bash
   git add index.html wrangler.toml
   git commit -m "Add Cloudflare Worker URL and config"
   git push
   ```

---

## ✅ Benefits of GitHub Integration

**Automatic Deployment:**
- Push code → Auto-deploys to Cloudflare ✨
- Pull requests → Get preview URLs
- Commit status checks in GitHub

**No Manual Work:**
- No copying/pasting code
- No manual redeployments
- Updates automatically

**Professional Workflow:**
- Same as Vercel (push to deploy)
- Build status in GitHub
- Easy rollbacks

---

## Method 2: Manual Deployment (Alternative)

If you prefer not to connect GitHub, you can still manually deploy:

1. Go to https://workers.cloudflare.com/
2. Create a new worker
3. Copy code from `cloudflare-worker.js`
4. Paste in editor
5. Add environment variable
6. Deploy manually

*(See CLOUDFLARE_WORKER_SETUP.md for detailed manual steps)*

---

## Testing Your Setup

After configuration, test with a large PDF:

```
1. Upload a 5MB scanned PDF transcript
2. Open browser console (F12)
3. Look for:
   ⚠️ Large scanned PDF detected (5.2MB)
   🌐 Using Cloudflare Worker endpoint for large file...
4. Should process successfully!
```

---

## How Automatic Deployment Works

### After Setup:

```
You: git push
      ↓
GitHub: Push detected
      ↓
Cloudflare: Auto-deploy worker
      ↓
Done: Live in ~30 seconds
```

### On Pull Requests:

- Cloudflare posts build status as comment
- Preview URL provided for testing
- Merge to main → Auto-deploy to production

---

## Updating Your Worker

### With GitHub Integration:
```bash
# Edit cloudflare-worker.js
git add cloudflare-worker.js
git commit -m "Update worker logic"
git push
# Cloudflare auto-deploys!
```

### Without GitHub Integration:
```bash
# Go to Cloudflare dashboard
# Copy new code from cloudflare-worker.js
# Paste in editor
# Click "Save and Deploy"
```

---

## Troubleshooting

### "Repository not found"
- Make sure your GitHub repo is not private
- Or grant Cloudflare access to private repos in GitHub settings

### "Build failed"
- Check that `wrangler.toml` is in project root
- Verify `main = "cloudflare-worker.js"` matches your filename

### "Environment variable not set"
- Go to Settings → Environment Variables
- Make sure `OPENROUTER_API_KEY` is set for "Production" environment
- Redeploy after adding variables

### Still showing "YOUR-SUBDOMAIN"?
- Check that you updated `index.html` with actual worker URL
- Clear browser cache
- Verify worker is deployed and shows "Active" status

---

## File Structure

After setup, your repo should have:

```
hkit-course-analyzer-deploy/
├── cloudflare-worker.js          # Worker code
├── wrangler.toml                 # Cloudflare config (NEW)
├── index.html                    # Updated with worker URL
└── CLOUDFLARE_WORKER_GITHUB_SETUP.md
```

---

## Free Tier Limits

**Cloudflare Workers Free Plan:**
- ✅ 100,000 requests/day
- ✅ 10MB request body size
- ✅ 10ms CPU time per request
- ✅ Unlimited domains/workers
- ✅ GitHub integration included

**More than enough for your use case!**

---

## Summary

✅ **5-minute setup** with GitHub integration
✅ **Auto-deployment** on every push
✅ **Free tier** is generous
✅ **Handles 7.5MB scanned PDFs**
✅ **Professional CI/CD workflow**

**Recommended:** Use Method 1 (GitHub Integration) for automatic deployments!
