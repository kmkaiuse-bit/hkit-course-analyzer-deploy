# HKIT Course Analyzer - Backend Setup Guide

## Overview
The HKIT Course Analyzer now uses a **secure backend server** to handle Gemini API calls. This means:
- ✅ **No user API key required** - API key is stored securely on the server
- ✅ **Better security** - API key never exposed to frontend
- ✅ **Easier for end users** - Just open the app and use it
- ✅ **Latest Gemini 2.5 Flash model** - Faster and smarter AI analysis

## Quick Start (3 Steps)

### Step 1: Configure Your API Key

1. Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

2. Open the `.env` file in the project root:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   NODE_ENV=development
   ```

3. Replace `your_actual_api_key_here` with your actual API key

### Step 2: Start the Backend Server

```bash
npm run server
```

You should see:
```
🌟 Learning Database API Server Running!
📡 Server: http://localhost:3001
🏥 Health: http://localhost:3001/api/health
```

### Step 3: Start the Frontend

In a **new terminal window**, start the HTTP server:

```bash
python -m http.server 8000
```

Then open your browser to:
```
http://localhost:8000/local/enhanced.html
```

## How It Works

### Architecture

```
Browser (Frontend)
    ↓
    | HTTP Request to http://localhost:3001/api/gemini
    ↓
Backend Server (Node.js + Express)
    ↓
    | Uses GEMINI_API_KEY from .env
    ↓
Google Gemini API (2.5 Flash)
    ↓
    | AI Response
    ↓
Backend Server
    ↓
    | JSON Response
    ↓
Browser (Shows Results)
```

### Security Benefits

1. **API Key Protection**: Your Gemini API key is stored in `.env` file which is:
   - Never committed to git (in `.gitignore`)
   - Only accessible to the backend server
   - Never exposed to browser/frontend

2. **Server-Side Validation**: All API requests go through your backend server first

3. **CORS Protection**: Only allows requests from your local development environment

## Configuration Files

### `.env` (Your Secret Configuration)
```bash
# Never commit this file to git!
GEMINI_API_KEY=AIza...your...key...here
NODE_ENV=development
```

### `.env.example` (Template for Others)
```bash
# Copy this to .env and fill in your values
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=production
```

## Backend API Endpoints

### 1. Health Check
**GET** `http://localhost:3001/api/health`

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-01T...",
  "server": "learning-api",
  "database": { ... }
}
```

### 2. Gemini AI Analysis
**POST** `http://localhost:3001/api/gemini`

Request body:
```json
{
  "prompt": "Your analysis prompt here...",
  "model": "gemini-2.5-flash",
  "files": [ ... ],
  "temperature": 0.3,
  "maxTokens": 8192
}
```

Response:
```json
{
  "success": true,
  "data": {
    "text": "AI response text...",
    "model": "gemini-2.5-flash"
  }
}
```

### 3. Learning Database Endpoints
- **GET** `/api/learning/status` - Get learning system status
- **POST** `/api/learning/context` - Get learning context for subjects
- **POST** `/api/learning/record` - Record analysis results
- **POST** `/api/learning/patterns` - Get relevant patterns
- **GET** `/api/learning/dashboard` - Get dashboard statistics

## Troubleshooting

### Problem: "Cannot connect to backend server"

**Solution:**
1. Make sure the backend server is running:
   ```bash
   npm run server
   ```

2. Check if port 3001 is available:
   ```bash
   # On Windows
   netstat -ano | findstr :3001

   # On Mac/Linux
   lsof -i :3001
   ```

3. Check server logs for errors

### Problem: "Gemini API key not configured"

**Solution:**
1. Check if `.env` file exists in project root
2. Verify `GEMINI_API_KEY` is set correctly
3. Make sure there are no extra spaces or quotes around the key
4. Restart the backend server after changing `.env`

### Problem: Frontend still asking for API key

**Solution:**
1. Clear browser cache and reload the page
2. Make sure you're using `local/enhanced.html` (not an old backup file)
3. Check browser console for any JavaScript errors

### Problem: API calls are slow or timing out

**Solution:**
1. Check your internet connection
2. Verify your Gemini API key has quota available
3. Try with smaller PDF files first
4. Check server logs for detailed error messages

## Model Information

### Gemini 2.5 Flash
- **Release**: August 2025
- **Context Window**: 1 million tokens
- **Output**: 65,536 tokens
- **Speed**: Optimized for fast responses
- **Quality**: Improved reasoning over 1.5 Flash
- **Cost**: Excellent price-performance ratio

### Why 2.5 Flash?
- ✅ Latest stable model
- ✅ Better at academic course matching
- ✅ Faster than previous versions
- ✅ Future-proof (1.5 models being deprecated in 2025)
- ✅ Handles very long transcripts (1M tokens)

## Development Commands

```bash
# Install dependencies
npm install

# Start backend server (port 3001)
npm run server

# Start backend with auto-reload (development)
npm run dev

# Start frontend (port 8000)
python -m http.server 8000

# Run tests
npm test

# Check test coverage
npm run test:coverage
```

## Port Configuration

| Service | Port | URL |
|---------|------|-----|
| Backend API | 3001 | http://localhost:3001 |
| Frontend | 8000 | http://localhost:8000 |
| Learning DB | (internal) | - |

## Next Steps

1. ✅ Backend server configured with Gemini 2.5 Flash
2. ✅ Frontend updated to use backend API
3. ✅ API key stored securely server-side
4. ⏭️ Test with real transcript PDFs
5. ⏭️ Deploy to production server (optional)

## Production Deployment Notes

For production deployment:

1. **Use a proper environment variable system** (not .env file)
2. **Deploy backend to a hosting service**:
   - Railway.app
   - Google Cloud Run
   - Heroku
   - AWS Elastic Beanstalk

3. **Update frontend API URL** from `http://localhost:3001` to your production URL

4. **Enable HTTPS** for secure communication

5. **Set up monitoring** for API usage and errors

## Support

For issues or questions:
- Check server logs: Backend terminal output
- Check browser console: F12 Developer Tools
- Review documentation in `/docs` folder
- Check GitHub issues (if applicable)

---

**Last Updated**: November 2025
**Version**: 2.0 (Backend-Powered with Gemini 2.5 Flash)
