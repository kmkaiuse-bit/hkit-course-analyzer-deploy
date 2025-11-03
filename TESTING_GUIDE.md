# Testing Guide - Where Are You Running?

## 500 Error: "API request failed"

This error means the API endpoint isn't working. Here's why:

### If Testing LOCALLY (http://localhost:8000):

**Problem**: `/api/gemini` only works on Vercel, not on local file server!

**Solutions**:

#### Solution A: Use Local Backend (For Testing)
```bash
# Terminal 1: Start backend server
npm run server

# Terminal 2: Start frontend server
python -m http.server 8000

# Open: http://localhost:8000/local/enhanced.html
```

#### Solution B: Deploy to Vercel (Recommended)
Stop testing locally and deploy to Vercel where `/api/gemini` will work!

---

### If Already on VERCEL (https://your-app.vercel.app):

**Problem**: Environment variable not set!

**Solution**:
1. Go to Vercel Dashboard
2. Your Project → Settings → Environment Variables
3. Make sure you added:
   ```
   Name: GEMINI_API_KEY
   Value: AIzaSyC9X2LHsLQXxCXpwQFNd41I6xrLpvLEJAc
   ```
4. Redeploy if you just added it

---

## Quick Decision Tree:

**Where are you testing?**

→ **Localhost** (http://localhost:8000)
  - Option 1: Deploy to Vercel NOW
  - Option 2: Use `npm run server` + `local/enhanced.html`

→ **Vercel** (https://....vercel.app)
  - Check environment variable is set
  - Redeploy after adding variable

---

## Recommended Path:

**Just deploy to Vercel!**

Testing locally is more complex because:
- Need to run backend server separately
- Need PostgreSQL for learning features
- Different configuration

**On Vercel**, everything just works:
- API endpoints work automatically
- Environment variables managed
- No local setup needed

---

## Current Status Check:

Run this command to see where you are:
```bash
# Check if backend server is running
curl http://localhost:3001/api/health

# If it responds → You can use local/enhanced.html
# If it fails → Deploy to Vercel instead
```
