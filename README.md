# 🎓 HKIT Course Analyzer

**AI-Powered Advanced Standing Application Processing System**  
Automates transcript analysis for Hong Kong Institute of Technology programs using Google Gemini AI

## ⚠️ **Current Status: September 2025**

**✅ Fully Functional**: Local enhanced version works perfectly  
**⚠️ Production Blocked**: Vercel free plan timeout limitation (10s vs required 15-45s)  
**💰 Solution**: Requires Vercel Pro ($20/month) or alternative hosting for production deployment

## 🚀 **Quick Start**

### **Recommended: Local Enhanced Version**
```bash
# Start local server
python -m http.server 8000

# Access full-featured version (NO timeout limits)
http://localhost:8000/local/enhanced.html

# Or basic version for quick testing
http://localhost:8000/local/demo.html
```

### **Production Deployment**
- **Status**: Blocked by 10-second Vercel timeout
- **Solution**: Upgrade to Vercel Pro or use alternative hosting
- **Documentation**: See `docs/deployment/DEPLOYMENT_STATUS_AND_SOLUTIONS.md`

## 📁 **Project Structure** (Reorganized September 2025)

```
hkit-course-analyzer/
├── 📁 docs/                    # All documentation (26+ files)
│   ├── 📁 project/            # Project overview & handover docs
│   ├── 📁 development/        # Technical development logs & PRDs
│   ├── 📁 deployment/         # Deployment guides & solutions
│   ├── 📁 demo/              # Demo & presentation materials
│   └── 📁 testing/           # Testing procedures & checklists
├── 📁 local/                   # Local development versions
│   ├── enhanced.html           # ⭐ RECOMMENDED: Full-featured version
│   ├── demo.html              # Basic testing version
│   └── backup-2025-09-11/     # Complete working backup
├── 📁 src/                     # Production source code
│   ├── index.html             # Main production app (has timeout issues)
│   └── assets/js/modules/     # Modular component system
├── 📁 api/                     # Vercel Functions
├── 📁 config/                  # Configuration files
├── 📁 archive/                 # Archived files (cleanup results)
└── 📁 sessions/               # Development session logs
```

## ✨ **Features** (Production Ready)

### **Core Functionality**
- 📄 **PDF Processing**: Robust PDF.js integration for transcript parsing (`local/assets/js/file-handler.js`)
- 🤖 **AI Analysis**: Google Gemini 1.5-flash for intelligent course matching (`local/assets/js/gemini-api.js`)
- 🎓 **6 Programmes**: Complete HKIT course templates database (`local/assets/js/templates.js`)
- 📊 **Smart Logic**: 50% max exemption rule with language course handling (`local/assets/js/gemini-api.js`)
- 💾 **Multi-Export**: CSV, Excel, PDF, JSON export capabilities (`local/assets/js/modules/advancedExporter.js`)

### **Enhanced User Experience (September 2025)**
- ⚡ **Loading States**: Professional animations and progress indicators  
- 🔔 **Notifications**: Real-time toast notifications with color coding
- 🔧 **API Testing**: Built-in API key validation and testing tools
- 🧹 **Cache Management**: One-click cache clearing for dropdown issues
- 🌐 **Bilingual Errors**: English/Chinese error messages
- 🛠️ **Debug Tools**: Advanced monitoring and troubleshooting panel

### **Student Workflow**
- 👨‍🎓 **Data Collection**: Comprehensive student information forms
- ✏️ **Edit Mode**: Full result modification and review capabilities  
- 📋 **Study Plans**: Automatic academic planning generation
- 💼 **Export Options**: Professional reports in multiple formats

## 🔧 **Technology Stack**

- **Frontend**: Vanilla JavaScript, HTML5, CSS3 (No frameworks - fast & lightweight)
- **PDF Processing**: PDF.js library for client-side parsing
- **AI Engine**: Google Gemini 1.5-flash model
- **Deployment**: Vercel serverless functions
- **Architecture**: Modular component system with enhanced error handling

## 📋 **Setup Instructions**

### **Prerequisites**
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))
- Python 3.x or Node.js (for local server)
- Modern web browser (Chrome, Firefox, Safari)

### **🚀 Quick Local Setup** (Recommended)
```bash
# 1. Clone repository
git clone [repository-url]
cd hkit-course-analyzer

# 2. Start local server
python -m http.server 8000
# OR: npx http-server -p 8000

# 3. Open enhanced version
http://localhost:8000/local/enhanced.html

# 4. Enter your Gemini API key in the interface
```

### **⚠️ Production Deployment Issues**
- **Problem**: Vercel free plan has 10-second timeout limitation
- **Impact**: Analysis requires 15-45 seconds, causing timeouts
- **Solutions**: 
  - Upgrade to Vercel Pro ($20/month) ← Recommended
  - Use Railway, Google Cloud Run, or self-hosting
  - See `docs/deployment/DEPLOYMENT_STATUS_AND_SOLUTIONS.md` for full options

## 📖 **Usage Guide**

### **Basic Workflow**
1. **Start Local Server**: `python -m http.server 8000`
2. **Open Enhanced Version**: `http://localhost:8000/local/enhanced.html`
3. **API Setup**: Enter your Gemini API key (stored in browser localStorage)
4. **Upload PDF**: Choose student transcript file
5. **Select Programme**: Choose HKIT program from dropdown
6. **Analyze**: Click analyze and wait for AI processing (15-45 seconds)
7. **Review Results**: Edit exemptions if needed
8. **Export**: Generate reports in CSV, Excel, or PDF format

### **Key Features Usage**
- **API Key Testing**: Use "Test API Key" button to verify connectivity
- **Cache Issues**: Use "Clear Cache" in Settings → Data Management if dropdown shows old subjects
- **Debug Mode**: Toggle debug panel for troubleshooting and monitoring
- **Student Info**: Fill out student details for professional reports
- **Edit Mode**: Modify AI suggestions before final export

## 🔒 **Security & Privacy**

- ✅ **API Key Protection**: Keys stored in localStorage (local) or Vercel environment (production)
- ✅ **No Data Storage**: Transcripts processed in memory, not stored permanently  
- ✅ **Client-Side Processing**: PDF parsing happens in browser for privacy
- ✅ **Secure AI Calls**: API proxy hides credentials from client-side code

## 📚 **Documentation**

- **📖 User Guide**: `docs/project/` - Complete usage instructions
- **🔧 Technical Guide**: `docs/CLAUDE.md` - Developer maintenance guide  
- **🚀 Deployment**: `docs/deployment/` - Production deployment solutions
- **📋 Learning Database**: `docs/development/PRD_LEARNING_DATABASE.md` - Future enhancement spec

## 🎯 **Business Impact**

**Time Savings**: 2-3 hours → 5-10 minutes (90% reduction)  
**Accuracy**: AI-powered matching reduces human error  
**Consistency**: Standardized analysis across all applications  
**Documentation**: Automatic professional report generation

## 📞 **Support & Maintenance**

- **Documentation**: Comprehensive self-service resources in `docs/` folder
- **Issues**: GitHub issues for technical problems  
- **Development**: All session logs preserved in `sessions/` folder
- **Backups**: Complete working backups in `local/backup-2025-09-11/`

---

**Status**: ✅ Fully Functional (Local) | ⚠️ Production Deployment Blocked (Timeout Issue)  
**Last Updated**: September 11, 2025  
**Next Phase**: Learning Database Implementation (See PRD in `docs/development/`)
