# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
HKIT Course Analyzer - A web application for analyzing HKIT course transcripts and determining advanced standing eligibility for university programs. The app uses Google Gemini AI to analyze PDF transcripts and match courses for exemptions.

## Tech Stack
- Frontend: Vanilla JavaScript, HTML5, CSS3
- PDF Processing: PDF.js
- AI Analysis: Google Gemini API (gemini-1.5-flash model)
- Deployment: Vercel Functions (serverless)
- Node.js: v18+ required

## Key Architecture

### Frontend Structure
- `index.html` - Main production app (uses Vercel Functions)
- `local-demo.html` - Basic local version with direct API calls
- `local-enhanced.html` - **Full-featured local version** with programme database
- `assets/js/app.js` - Main application controller
- `assets/js/gemini-api.js` - API integration layer with local/production mode detection
- `assets/js/file-handler.js` - PDF handling with PDF.js
- `assets/js/templates.js` - University programme templates database

### Backend (Vercel Functions)
- `api/gemini.js` - Main Gemini API proxy endpoint
- Handles CORS, API key management, and request processing
- 60-second timeout limit for Vercel Functions

### Module System
Key modules initialized in sequence:
1. FileHandler - PDF upload and parsing
2. StudentInfoManager - Student data management  
3. EditModeController - Result editing features
4. StudyPlanGenerator - Study plan creation
5. AdvancedExporter - CSV/print export

## Development Commands

### Local Development
```bash
# Python local server (no build required)
python -m http.server 8000
# Access at: http://localhost:8000/local-demo.html

# Or use Node.js
npm install -g http-server
http-server -p 8000
```

### Deployment
```bash
# Deploy to Vercel (automatic from main branch)
vercel --prod

# Set environment variable
vercel env add GEMINI_API_KEY
```

## Environment Variables
Required for production (set in Vercel):
- `GEMINI_API_KEY` - Google Gemini API key

For local development:
- Create `.env.local` with `GEMINI_API_KEY=your_key_here`
- Or use `local-demo.html` which accepts API key input directly

## API Configuration
- Production: Uses `/api/gemini` endpoint via Vercel Functions
- Local: Direct Gemini API calls with client-side key
- Config files: `config/api-config.js` (production), `config/api-config-local.js` (local)

## Local Enhanced Version (Recommended for Development)

### Overview
`local-enhanced.html` provides the **complete feature set** with programme database integration, bypassing Vercel's timeout limitations.

### Setup & Usage
```bash
# Option 1: Direct file access
# Open: file:///path/to/local-enhanced.html

# Option 2: Python server (recommended)
python -m http.server 8000
# Visit: http://localhost:8000/local-enhanced.html

# Option 3: Node.js server
http-server -p 8000
```

### Full Feature Set Available:
- ✅ Complete programme database (Computing, Business, Cybersecurity, Healthcare, AI, etc.)
- ✅ Student information management forms
- ✅ Advanced export options (CSV, Excel, PDF, JSON)
- ✅ Edit mode controllers for result modification
- ✅ Study plan generation
- ✅ No timeout restrictions for large PDF processing

### Local Versions Comparison
| Feature | `local-demo.html` | `local-enhanced.html` |
|---------|------------------|---------------------|
| Programme Database | ❌ Basic university buttons | ✅ Full structured templates |
| Student Info Forms | ❌ | ✅ Complete workflow |
| Advanced Exports | ❌ Basic CSV only | ✅ CSV, Excel, PDF, JSON |
| Edit Mode | ❌ | ✅ Full editing capabilities |
| Timeout Limits | ✅ None | ✅ None |
| API Key Storage | ✅ localStorage | ✅ localStorage |

### When to Use Each Version
- **`local-enhanced.html`** - Primary development and demonstration tool
- **`local-demo.html`** - Quick testing or minimal functionality needs
- **`index.html`** - Production deployment on Vercel

## Common Tasks

### Adding New University Programme
1. Edit `assets/js/templates.js`
2. Add programme object to `programmes` array with course list
3. Programme will automatically appear in UI

### Modifying Exemption Logic
- Edit prompt in `assets/js/gemini-api.js:createPrompt()`
- Key criteria: 50% max exemptions, language course rules, pass grades
- **Language Course Rules**: Update Special Language Rule for school-specific course codes
- Balance prompt length vs processing time when adding new rules

### Debugging API Issues
**Production (`index.html`):**
- Verify API key in Vercel environment variables
- Monitor Vercel Functions logs for server-side errors
- Test with `api/test.js` endpoint first

**Local Enhanced (`local-enhanced.html`):**
- Check browser console for detailed errors
- Verify API key in localStorage (F12 → Application → Local Storage)
- Look for "📍" debug messages in console for API call tracing
- Use browser network tab to monitor direct Gemini API calls

**Common Issues:**
- "GeminiAPI is not defined" → Script loading order issue
- "Maximum call stack size exceeded" → API configuration conflicts
- Timeout errors → Use local-enhanced.html for large files

## Important Notes
- PDF files are converted to base64 and sent to Gemini API
- Large PDFs may timeout on Vercel - use `local-enhanced.html` for large files
- CORS is handled by Vercel Functions configuration (production only)
- API key is never exposed to frontend in production
- Maximum output tokens limited to 8192 to prevent timeouts
- Local enhanced version has no timeout restrictions but exposes API key to client

## Current Development Status
- ✅ **Working**: `local-enhanced.html` with full programme database integration
- ✅ **Fixed**: GeminiAPI integration, stack overflow errors, API mode detection
- ✅ **Backup**: Complete working version saved in `backup-working-version/`
- 🔄 **In Progress**: Language course exemption rule enhancements
- 📋 **Planned**: Multiple transcript support, AI suggested column in edit mode

## Backup & Recovery
- **Working backup location**: `backup-working-version/`
- **Restore command**: `cp -r backup-working-version/* ./`
- **Direct backup usage**: Open `backup-working-version/local-enhanced.html`