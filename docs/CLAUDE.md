# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
HKIT Course Analyzer - A web application for analyzing HKIT course transcripts and determining advanced standing eligibility for university programs. The app uses Google Gemini AI to analyze PDF transcripts and match courses for exemptions.

**Recent Updates (September 2025):**
- ✅ Enhanced UI/UX with loading states and visual polish
- ✅ Improved API key validation and testing
- ✅ Centralized error handling with user-friendly messages
- ✅ Cache management system for dropdown issues
- ✅ Complete folder reorganization for better maintainability
- 📋 **Planned**: Learning database system for AI accuracy improvement

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
6. **New Modules (Enhanced):**
   - NotificationManager - Toast notifications and user feedback
   - ErrorHandler - Centralized error handling with user-friendly messages
   - DebugMonitor - Real-time monitoring and debugging tools
   - DataManager - Enhanced data management with cache clearing
   - SubjectCollector - Improved subject extraction with cache management

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
- ✅ **Enhanced Features (September 2025):**
  - Enhanced API key testing with "Test API Key" button
  - Real-time toast notifications for user feedback
  - Cache management system with "Clear Cache" functionality
  - Centralized error handling with bilingual error messages
  - Debug monitoring panel for advanced users
  - Visual loading states and improved animations

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
- Cache-related dropdown issues → Use DataManager.clearCache() or Settings → Clear Cache
- User complaints about confusing errors → ErrorHandler provides bilingual error messages

## Enhanced Features & Modules (September 2025)

### **New User Experience Features**
- **Toast Notifications**: Real-time feedback with color-coded messages
- **Loading States**: Professional loading spinners and progress indicators
- **Enhanced API Key Management**: "Test API Key" button with response time tracking
- **Cache Management**: One-click cache clearing to fix dropdown issues
- **Error Handling**: User-friendly error messages in English/Chinese
- **Visual Polish**: Smooth animations, hover effects, improved typography

### **New Development Tools**
- **Debug Monitor**: Real-time activity logging and database statistics
- **Error Analytics**: Centralized error logging with pattern detection
- **Cache Information**: Detailed cache status and storage usage
- **Data Management**: Enhanced import/export with user feedback

### **Enhanced Module Functions**
```javascript
// Key new functions available
NotificationManager.show(message, type, duration);
ErrorHandler.handleError(error, context);
DataManager.clearCache();  // Fix dropdown issues
SubjectCollector.clearCache();  // Reset subject cache
DebugMonitor.togglePanel();  // Show/hide debug tools
```

## Important Notes
- PDF files are converted to base64 and sent to Gemini API
- Large PDFs may timeout on Vercel - use `local-enhanced.html` for large files
- CORS is handled by Vercel Functions configuration (production only)
- API key is never exposed to frontend in production
- Maximum output tokens limited to 8192 to prevent timeouts
- Local enhanced version has no timeout restrictions but exposes API key to client
- **Cache Issues**: If dropdown shows old subjects, use "Clear Cache" in Settings → Data Management

## Project Structure (Updated September 2025)

The project has been completely reorganized for better maintainability:

```
hkit-course-analyzer/
├── 📁 docs/                    # All documentation (26+ files)
│   ├── 📁 project/            # General project documentation
│   ├── 📁 development/        # Technical development logs & PRDs
│   ├── 📁 deployment/         # Deployment guides (Vercel SOP)
│   ├── 📁 demo/              # Demo & presentation materials
│   └── 📁 testing/           # Testing procedures & checklists
├── 📁 archive/                 # Archived files (old backups, legacy docs)
│   ├── 📁 2025-09-11/        # Recent cleanup archive
│   └── 📁 backups/           # Previous backup system
├── 📁 src/                     # Source code (production)
├── 📁 local/                   # Local development version
├── 📁 api/                     # Vercel Functions
├── 📁 config/                  # Configuration files
├── 📁 assets/                  # CSS, JS, and static files
└── 📁 sessions/               # Development session logs
```

## Key Locations

### **Documentation**
- **Project docs**: `docs/project/` - README, integration guides
- **Development**: `docs/development/` - PRDs, problem tracking, enhancement logs
- **Learning Database PRD**: `docs/development/PRD_LEARNING_DATABASE.md`

### **Core Files**
- **Main App**: `local/enhanced.html` (recommended for development)
- **Production**: `index.html` (Vercel deployment)
- **API Config**: `config/api-config-local.js` (local), `api/gemini.js` (production)

## Current Development Status

### **✅ Recently Completed (September 2025)**
- **UI/UX Enhancements**: Loading states, animations, visual polish
- **API Key Management**: Enhanced validation, testing, error handling
- **Error System**: Centralized error handling with user-friendly messages
- **Cache Management**: Fixed dropdown issues with cache clearing
- **Project Organization**: Complete folder restructure for maintainability
- **Notification System**: Toast notifications for better user feedback

### **🔄 In Progress**
- Learning database system design and planning
- AI accuracy improvement through historical pattern learning

### **📋 Planned Features**
- **Learning Database**: HKIT-centric exemption pattern storage
- **AI Enhancement**: Use historical decisions to improve accuracy
- **Batch Processing**: Multiple transcript support
- **Analytics**: Learning effectiveness monitoring

## Backup & Recovery

### **Current Backups**
- **Enhanced Version Backup**: `local/backup-2025-09-11/`
- **Legacy Backups**: `archive/backups/`
- **Complete Archive**: `archive/` folder contains all old files

### **Recovery Commands**
```bash
# Restore from recent backup
cp -r local/backup-2025-09-11/* local/

# Access archived files
ls archive/2025-09-11/  # Recent cleanup archive
ls archive/backups/     # Legacy backups
```