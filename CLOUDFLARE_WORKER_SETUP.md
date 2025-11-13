# Cloudflare Worker Setup for Large Scanned PDFs

## Why You Need This

Your transcripts are **scanned image PDFs** which are large files. Vercel's free tier has a **4.5MB request body limit**, but most scanned PDFs are 5-10MB after base64 encoding.

**Cloudflare Workers** has a **10MB limit** on the free tier - perfect for your use case!

---

## Benefits

- ✅ **Free**: 100,000 requests/day on free tier
- ✅ **Larger Files**: Support up to 7.5MB PDFs (vs 3.5MB on Vercel)
- ✅ **Fast**: Global edge network (faster than centralized servers)
- ✅ **Easy Setup**: 5 minutes to deploy
- ✅ **No Credit Card**: Free tier doesn't require payment details

---

## Setup Instructions (5 Minutes)

### Step 1: Create Cloudflare Account
1. Go to https://workers.cloudflare.com/
2. Click "Sign Up" (free, no credit card needed)
3. Verify your email

### Step 2: Create a Worker
1. Click "Create a Worker"
2. You'll see a code editor with default code
3. **Delete all the default code**
4. Copy the entire contents of `cloudflare-worker.js` from your project
5. Paste it into the worker editor

### Step 3: Add Your OpenRouter API Key
1. In the worker editor, click **"Settings"** tab
2. Scroll to **"Environment Variables"** section
3. Click **"Add variable"**
4. Set:
   - **Variable name**: `OPENROUTER_API_KEY`
   - **Value**: Your OpenRouter API key (same one used in Vercel)
5. Click **"Save"**

### Step 4: Deploy
1. Click **"Save and Deploy"** button (top right)
2. Your worker will be deployed instantly
3. You'll see a URL like: `https://hkit-analyzer.YOUR-SUBDOMAIN.workers.dev`
4. **Copy this URL**

### Step 5: Configure Your App
1. Open `index.html` in your project
2. Find this line (around line 28):
   ```javascript
   window.CLOUDFLARE_WORKER_URL = '';
   ```
3. Update it with your worker URL:
   ```javascript
   window.CLOUDFLARE_WORKER_URL = 'https://hkit-analyzer.YOUR-SUBDOMAIN.workers.dev';
   ```
4. Save and commit the changes
5. Push to GitHub (Vercel will auto-deploy)

---

## How It Works

### Automatic Routing
The app automatically chooses the best endpoint:

| PDF Size | Endpoint Used | Limit |
|----------|---------------|-------|
| < 3.5MB | Vercel (standard) | 4.5MB |
| 3.5MB - 7.5MB | Cloudflare Worker | 10MB |
| > 7.5MB | Error with instructions to split file | - |

### Example Flow
```
User uploads 5MB scanned PDF
→ App detects file is > 3.5MB
→ Automatically uses Cloudflare Worker
→ Processes successfully (within 10MB limit)
→ Returns results to user
```

---

## Testing

After setup, test with a large PDF:

1. Upload a 4-6MB scanned transcript
2. Open browser console (F12)
3. You should see:
   ```
   ⚠️ Large scanned PDF detected (5.2MB)
   🌐 Using Cloudflare Worker endpoint for large file...
   ```
4. If it works, you're all set!

---

## Troubleshooting

### Error: "OPENROUTER_API_KEY not configured"
- Make sure you added the environment variable in Step 3
- Redeploy the worker after adding the variable

### Error: "Failed to fetch"
- Check that you copied the full worker URL correctly
- Make sure the URL starts with `https://`
- Verify the worker is deployed (green status in Cloudflare dashboard)

### Error: "Method not allowed"
- The worker might not be properly deployed
- Try redeploying by clicking "Save and Deploy" again

### Still using Vercel endpoint?
- Clear your browser cache (Ctrl+Shift+Delete)
- Verify `CLOUDFLARE_WORKER_URL` is set in index.html
- Check browser console for the routing message

---

## Cost Analysis

### Free Tier Limits
- **100,000 requests/day** = ~3 million/month
- **10 MB request body size**
- **10 ms CPU time per request**
- **No credit card required**

### Typical Usage
- Average school: 50-200 applications/month
- Each application: 1-3 API requests
- **Total**: ~150-600 requests/month
- **Free tier usage**: Less than 0.02% 😊

### If You Exceed Free Tier
- Paid plan: $5/month for 10 million requests
- You'll be notified before any charges
- Very unlikely to exceed with normal use

---

## Security

Your API key is:
- ✅ Stored as an environment variable (not in code)
- ✅ Never exposed to the browser
- ✅ Encrypted by Cloudflare
- ✅ Same security level as Vercel

---

## Questions?

1. **Do I need both Vercel and Cloudflare?**
   - Yes! Use Vercel for small files (faster) and Cloudflare for large ones

2. **Can I use only Cloudflare?**
   - Yes, but Vercel is faster for small files since it's already deployed

3. **What if I have really large PDFs (>10MB)?**
   - Option 1: Split into multiple files
   - Option 2: Compress/reduce resolution
   - Option 3: Use paid tier (100MB limit, $5/month)

4. **Do I need to pay for anything?**
   - No! Both Vercel and Cloudflare free tiers are sufficient

---

## Summary

✅ 5-minute setup
✅ Completely free
✅ Handles PDFs up to 7.5MB (2x larger than Vercel)
✅ Automatic routing (no manual selection needed)
✅ Perfect for scanned image transcripts

**Ready to set up?** Follow the steps above and you'll be processing large PDFs in no time!
