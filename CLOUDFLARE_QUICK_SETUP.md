# Cloudflare Worker - Super Simple Setup (3 Minutes)

## ✅ Use This File: `cloudflare-worker-simple.js`

This version works directly in the Cloudflare dashboard - **no build process needed!**

---

## Step-by-Step Instructions

### 1. Go to Cloudflare
Visit: https://dash.cloudflare.com/

Sign up (free, no credit card needed) or login

### 2. Create Worker
1. Click **"Workers & Pages"** in the left sidebar
2. Click **"Create Worker"** button
3. You'll see a code editor with default code

### 3. Replace Code
1. **Delete ALL the default code** in the editor
2. Open `cloudflare-worker-simple.js` from your project
3. **Copy ALL the code** (Ctrl+A, Ctrl+C)
4. **Paste** into the Cloudflare editor (Ctrl+V)

### 4. Save and Deploy
1. Click **"Save and Deploy"** button (top right)
2. Wait ~5 seconds for deployment
3. You'll see "Successfully deployed"

### 5. Add API Key
1. Click **"Settings"** tab (top of page)
2. Scroll down to **"Environment Variables"** section
3. Click **"Add variable"** button
4. Fill in:
   - **Variable name**: `OPENROUTER_API_KEY`
   - **Type**: Text (default)
   - **Value**: (paste your OpenRouter API key)
5. Click **"Save"** button
6. Click **"Deploy"** to apply the change

### 6. Get Your Worker URL
1. Go back to the main worker page (click worker name at top)
2. Your URL is shown at the top, looks like:
   ```
   https://hkit-analyzer.YOUR-NAME.workers.dev
   ```
3. **Copy this URL**

### 7. Update Your App
1. Open `index.html` in your project
2. Find this line (around line 28):
   ```javascript
   window.CLOUDFLARE_WORKER_URL = '';
   ```
3. Update it with your worker URL:
   ```javascript
   window.CLOUDFLARE_WORKER_URL = 'https://hkit-analyzer.YOUR-NAME.workers.dev';
   ```
4. Save the file

### 8. Commit and Push
```bash
git add index.html cloudflare-worker-simple.js CLOUDFLARE_QUICK_SETUP.md
git commit -m "Add Cloudflare Worker for large PDF support"
git push origin main
```

---

## ✅ Done!

Your app can now handle large scanned PDFs up to 7.5MB!

---

## Testing

1. Upload a 5MB scanned PDF
2. Open browser console (F12)
3. You should see:
   ```
   ⚠️ Large scanned PDF detected (5.2MB)
   🌐 Using Cloudflare Worker endpoint for large file...
   ✅ Processing successful
   ```

---

## Troubleshooting

### "API key not configured"
- Make sure you added `OPENROUTER_API_KEY` in Step 5
- Click "Deploy" again after adding the variable
- Wait 10 seconds, then try again

### "Failed to fetch" or CORS error
- Double-check the worker URL in `index.html`
- Make sure it starts with `https://`
- Clear browser cache (Ctrl+Shift+Delete)

### Still using Vercel endpoint?
- Verify `CLOUDFLARE_WORKER_URL` is set in index.html
- Make sure the URL doesn't have trailing spaces
- Check console for "Using Cloudflare Worker" message

---

## File Sizes Supported

| PDF Size | Endpoint | Result |
|----------|----------|--------|
| 0-3.5MB | Vercel (fast) | ✅ Works |
| 3.5-7.5MB | Cloudflare Worker | ✅ Works |
| 7.5MB+ | Error | ❌ Need to split file |

---

## Why This Version Works

The `cloudflare-worker-simple.js` file uses **Service Worker format** which:
- ✅ Works in the dashboard editor
- ✅ No build process needed
- ✅ No npm, no wrangler, no CLI
- ✅ Just copy-paste and deploy

The other file (`cloudflare-worker.js`) uses ES modules which require `wrangler deploy` from command line.

---

## Summary

✅ **3 minutes** to set up
✅ **No command line** needed
✅ **No build tools** required
✅ **Copy, paste, deploy** - that's it!
✅ **Handles 7.5MB scanned PDFs**

This is the **easiest way** to deploy a Cloudflare Worker!
