# 🎓 HKIT Course Exemption Analyzer

**AI-Powered Advanced Standing Application Processing System**
Automates transcript analysis for Hong Kong Institute of Technology programs using Google Gemini AI with cloud database persistence.

## 🌐 **Live Production Site**

**🚀 https://hkit-course-analyzer-deploy.vercel.app/**

- ✅ Fully functional with Supabase cloud database
- ✅ Auto-deploys on every GitHub push
- ✅ Manual "Save to Database" workflow for verified results
- ✅ Technical Support: stevenkok@hkit.edu.hk

---

## ⚡ **Current Status: January 2025**

**✅ Production Ready**: Deployed on Vercel with full Supabase integration
**✅ Cloud Database**: Automatic data persistence to Supabase PostgreSQL
**✅ User-Controlled Saves**: Manual confirmation workflow prevents incorrect data
**✅ Three-Tier Storage**: Supabase Cloud → PostgreSQL Server → IndexedDB fallback
**✅ Environment Separation**: Distinct production (Gemini) and testing (OpenRouter) environments

### **⚠️ IMPORTANT: Two Separate Environments**

This project has **TWO distinct environments** - do NOT mix them:

| Environment | Entry Point | API Provider | Use Case |
|-------------|-------------|--------------|----------|
| 🌍 **Production** | `index.html` | Gemini API (Vercel) | Live deployment, stable |
| 🧪 **Testing** | `local/enhanced.html` | OpenRouter (Local) | Experiments, local only |

📖 **See:** [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for detailed setup instructions

---

## 🚀 **Quick Start**

### **For End Users (Production)**
1. Visit: **https://hkit-course-analyzer-deploy.vercel.app/**
2. Enter your Google Gemini API key
3. Upload transcript PDF
4. Click "Analyze Files"
5. Review/edit results if needed
6. Click "💾 Save to Database" to persist to cloud

### **For Developers (Production)**
```bash
# Clone repository
git clone https://github.com/kmkaiuse-bit/hkit-course-analyzer-deploy.git
cd hkit-course-analyzer-deploy

# Install dependencies
npm install

# Start local development server
python -m http.server 8000
# OR: npx http-server -p 8000

# Open in browser
http://localhost:8000/
```

### **For Developers (Testing Environment)**
```bash
# Start backend server (optional, for backend mode)
npm run server

# Open testing environment
start local/enhanced.html
# OR: python -m http.server 8000 && open http://localhost:8000/local/enhanced.html

# Configure testing environment
# See ENVIRONMENT_SETUP.md for detailed instructions
```

---

## 📁 **Project Structure**

### **🌍 Production Environment** (Deployed on Vercel)
```
📦 Production Files (index.html → Vercel)
├── 📄 index.html                         # 🌍 PRODUCTION entry point
├── 📁 assets/                            # 🌍 Production static assets
│   ├── 📁 css/                          # Stylesheets
│   └── 📁 js/                           # JavaScript modules
│       ├── 📁 modules/                  # Core application modules
│       │   ├── storageManager.js        # Supabase + IndexedDB storage
│       │   ├── editModeController.js
│       │   ├── studentInfoManager.js
│       │   └── ...
│       ├── supabase-client.js           # Supabase cloud database client
│       ├── learning-client.js           # PostgreSQL learning system
│       ├── gemini-api.js                # Google Gemini AI integration
│       └── app.js                       # Main application logic
├── 📁 config/                            # 🌍 Production configuration
│   ├── api-config.production.js         # ⭐ Production config (Gemini via Vercel)
│   ├── api-config.js                    # Copy of production config
│   ├── supabase-config.js               # Supabase connection settings
│   └── client-api-config.template.js    # Template (safe to commit)
├── 📁 api/                               # 🌍 Vercel serverless functions
│   ├── gemini.js                        # Gemini API proxy endpoint
│   ├── gemini-upload.js                 # File upload to Gemini Files API
│   ├── gemini-analyze-file.js           # Analyze with file reference
│   └── gemini-chunked.js                # Chunked processing
```

### **🧪 Testing Environment** (Local Development Only)
```
📦 Testing Files (local/enhanced.html → Local)
├── 📁 local/                             # 🧪 TESTING environment
│   ├── enhanced.html                    # 🧪 TESTING entry point
│   ├── 📁 assets/                       # Testing-specific assets
│   │   └── 📁 js/                       # Testing JavaScript modules
│   │       ├── gemini-api.js            # OpenRouter integration
│   │       └── utils.js                 # Enhanced utilities
│   └── 📁 config/                       # 🧪 Testing configuration
│       └── api-config-smart.js          # Smart environment detector
├── 📁 config/                            # 🧪 Testing configuration
│   ├── api-config.testing.js            # ⭐ Testing config (OpenRouter)
│   └── client-api-config.js             # Local API key (gitignored)
```

### **📚 Documentation & Environment Separation**
```
📦 Documentation Files
├── ENVIRONMENT_SETUP.md                  # ⭐ Complete environment setup guide
├── ENVIRONMENT_SEPARATION_PLAN.md        # ⭐ Implementation plan & tracking
├── SECURITY_AUDIT_2025-01-05.md          # ⭐ Security audit report
├── OPENROUTER_MIGRATION_PLAN.md          # Testing environment guidelines
├── MASTER_TECHNICAL_DOCUMENTATION.md     # Technical overview
├── README.md                             # This file
├── .env.example                          # Production env template
└── .env.local.example                    # Testing env template
```

### **🗄️ Database & Infrastructure**
```
📦 Database & Deployment
├── 📁 db/                                # Database schemas
│   └── migrations/
│       ├── 001_initial_schema.sql
│       └── 002_supabase_schema.sql
├── 📁 server/                            # Backend server (optional)
│   └── learning-server.js               # PostgreSQL learning system
└── vercel.json                          # Vercel deployment config
```

### **🔑 Key Files for Environment Separation**

| File | Environment | Purpose |
|------|-------------|---------|
| `index.html` | 🌍 Production | Entry point for production (Vercel) |
| `local/enhanced.html` | 🧪 Testing | Entry point for testing (Local) |
| `config/api-config.production.js` | 🌍 Production | Gemini API via Vercel Functions |
| `config/api-config.testing.js` | 🧪 Testing | OpenRouter API (experimental) |
| `api/gemini.js` | 🌍 Production | Server-side Gemini SDK |
| `local/assets/js/gemini-api.js` | 🧪 Testing | Client-side OpenRouter calls |

---

## ✨ **Features**

### **Core Functionality**
- 📄 **PDF Processing**: Robust PDF.js integration for transcript parsing
- 🤖 **AI Analysis**: Google Gemini 1.5-flash for intelligent course matching
- 🎓 **6 Programmes**: Complete HKIT course templates database
- 📊 **Smart Logic**: 50% max exemption rule with language course handling
- 💾 **Multi-Export**: CSV, Excel, PDF export capabilities

### **Cloud Database Integration** (New - November 2025)
- ☁️ **Supabase Integration**: Automatic cloud database connectivity
- 💾 **Manual Save Workflow**: User confirms before saving to prevent incorrect data
- 📊 **Learning System**: Saved decisions improve future AI predictions
- 🔄 **Three-Tier Fallback**: Supabase → PostgreSQL → IndexedDB
- 📈 **Analytics**: Track exemption patterns across all analyses

### **Enhanced User Experience**
- ✏️ **Edit Mode**: Full result modification and review capabilities
- 🔔 **Notifications**: Real-time toast notifications with status updates
- 🌐 **Bilingual**: English/Chinese support throughout
- 📋 **Study Plans**: Automatic academic planning generation
- 🛠️ **Debug Tools**: Built-in monitoring and troubleshooting

### **Student Workflow**
1. 👨‍🎓 **Input**: Upload transcript + fill student information
2. 🤖 **Analysis**: AI processes and suggests exemptions
3. ✏️ **Review**: Edit/modify results if needed
4. 💾 **Save**: Confirm and save to cloud database
5. 📊 **Export**: Download results in multiple formats

---

## 🔧 **Technology Stack**

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **PDF Processing**: PDF.js for client-side parsing
- **AI Engine**: Google Gemini 1.5-flash model
- **Cloud Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel serverless platform
- **Architecture**: Modular component system with error handling

---

## 🗄️ **Database Architecture**

### **Supabase Cloud Database**

The system uses Supabase PostgreSQL with 4 main tables:

#### **1. exemption_patterns**
Stores historical exemption decisions for AI learning:
- `previous_subject` - Subject from previous institution
- `hkit_subject_code` - Matched HKIT course code
- `exempted` - TRUE if exempted, FALSE if rejected
- `confidence_score` - AI confidence level (0-1)
- `time_weighted_score` - Recency-weighted confidence

#### **2. decision_history**
Tracks individual exemption decisions:
- `student_id` - Student identifier
- `previous_subject` - Original subject name
- `hkit_subject` - HKIT course matched
- `decision` - Granted/Rejected/Pending
- `decision_timestamp` - When decision was made

#### **3. analysis_results**
Complete analysis session records:
- `programme_code` - HKIT programme applied to
- `transcript_subjects` - All subjects analyzed (JSON)
- `exemption_results` - Complete results (JSON)
- `total_subjects_analyzed` - Count of subjects
- `total_exemptions_granted` - Count of exemptions
- `student_id` - Optional student reference

#### **4. audit_log**
Change tracking for all database operations:
- `table_name` - Which table was modified
- `operation` - INSERT/UPDATE/DELETE
- `changed_by` - User/system identifier
- `changes` - What changed (JSON)

### **Storage Priority**
1. **Supabase Cloud** (Primary) - Always attempted first
2. **PostgreSQL Server** (Fallback) - localhost:3001 if available
3. **IndexedDB** (Offline) - Browser storage as last resort

---

## 📋 **Setup & Deployment**

### **Prerequisites**
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))
- Supabase account (free tier available)
- Vercel account (free tier sufficient)
- GitHub account

### **Initial Setup**

#### **1. Supabase Database Setup**
```bash
# 1. Create Supabase project at https://supabase.com
# 2. Run database schema
# Copy content from: db/migrations/002_supabase_schema.sql
# Paste into Supabase SQL Editor and execute

# 3. Get credentials
# Supabase Dashboard → Settings → API
# - Project URL: https://[PROJECT-REF].supabase.co
# - anon public key: eyJhbGci...
```

#### **2. Configure Application**
```javascript
// Update config/supabase-config.js
const SUPABASE_CONFIG = {
    url: 'https://YOUR-PROJECT-REF.supabase.co',
    anonKey: 'YOUR-ANON-KEY-HERE',
    enabled: true
};
```

#### **3. Deploy to Vercel**
```bash
# Option 1: Vercel CLI
npm i -g vercel
vercel --prod

# Option 2: GitHub Integration
# 1. Push code to GitHub
# 2. Import project in Vercel dashboard
# 3. Vercel auto-deploys on every push
```

#### **4. Supabase-Vercel Integration** (Optional)
```bash
# In Supabase Dashboard:
# Integrations → Vercel → Connect
# This auto-syncs environment variables
```

**Detailed Setup Guide**: See `docs/deployment/SUPABASE_VERCEL_SETUP_SOP.md`

---

## 🔑 **Configuration**

### **API Keys**

The system requires a Google Gemini API key for AI analysis:

1. **Get API Key**: https://makersuite.google.com/app/apikey
2. **Enter in UI**: Paste key in API configuration section
3. **Storage**: Saved in browser localStorage (user's device only)

### **Database Configuration**

Supabase credentials are stored in `config/supabase-config.js`:
- **Safe to commit**: The anon key is designed for public use
- **Protected by RLS**: Row Level Security policies protect data
- **Auto-detection**: Checks for Vercel env vars first

---

## 🌍 **Environment Separation**

### **Overview**

The project uses **separate configurations** for production and testing environments:

| Environment | API Provider | Entry Point | Config File | Purpose |
|-------------|--------------|-------------|-------------|---------|
| **Production** | Gemini API | `index.html` | `api-config.production.js` | Stable, deployed on Vercel |
| **Testing** | OpenRouter | `local/enhanced.html` | `api-config.testing.js` | Experimental, local only |

### **Why Separate Environments?**

- ✅ **Stability**: Production remains stable while testing new features
- ✅ **Security**: Server-side API keys in production, client-side allowed in testing
- ✅ **Flexibility**: Experiment with OpenRouter without affecting production
- ✅ **Isolation**: No mixing of configurations or providers

### **Production Environment (Gemini)**

**Deployment**: Vercel serverless platform
**API Provider**: Google Gemini API
**API Key Storage**: Vercel environment variables (server-side only)
**Entry Point**: `index.html`
**Config**: `config/api-config.production.js`

```javascript
// Production config loads via Vercel Functions
const API_CONFIG = {
    ENVIRONMENT: 'production',
    API_PROVIDER: 'gemini',
    functions: {
        gemini: '/api/gemini',
        geminiChunked: '/api/gemini-chunked'
    }
};
```

**Setup Instructions**:
1. Add `GEMINI_API_KEY` to Vercel Dashboard environment variables
2. Deploy via GitHub push (auto-deploys)
3. Access at: https://hkit-course-analyzer-deploy.vercel.app/

### **Testing Environment (OpenRouter)**

**Deployment**: Local development only
**API Provider**: OpenRouter (experimental)
**API Key Storage**: `.env.local` or `config/client-api-config.js`
**Entry Point**: `local/enhanced.html`
**Config**: `config/api-config.testing.js`

```javascript
// Testing config supports both backend and frontend modes
const API_CONFIG = {
    ENVIRONMENT: 'testing',
    API_PROVIDER: 'openrouter',
    backend: {
        baseUrl: 'http://localhost:3001'
    },
    openrouter: {
        model: 'google/gemini-2.5-pro'
    }
};
```

**Setup Instructions**:
1. Copy `.env.local.example` to `.env.local`
2. Add `OPENROUTER_API_KEY` (optional)
3. Start backend: `npm run server` (optional)
4. Open: `local/enhanced.html`

### **Switching Between Environments**

```bash
# Use Production (Gemini)
start index.html
# OR deploy to Vercel: git push origin main

# Use Testing (OpenRouter)
start local/enhanced.html
# With backend: npm run server (in separate terminal)
```

### **Security Model**

**Production (Secure)**:
- ✅ API keys stored in Vercel environment variables
- ✅ All API calls go through serverless functions
- ✅ No client-side key exposure
- ✅ Keys never committed to git

**Testing (Local Only)**:
- ⚠️ Client-side keys allowed for testing convenience
- ⚠️ `.env.local` and `client-api-config.js` in `.gitignore`
- ⚠️ Never use production keys in testing
- ✅ Backend mode recommended for better security

### **Configuration Files**

```
config/
├── api-config.production.js     # Production (Gemini, Vercel Functions)
├── api-config.testing.js        # Testing (OpenRouter experiments)
├── api-config.js                # Production copy (for Vercel compatibility)
├── client-api-config.template.js # Template (safe to commit)
└── client-api-config.js         # Your local keys (gitignored)

.env.example                      # Production env template
.env.local.example                # Testing env template
.env.local                        # Your local env (gitignored)
```

### **Detailed Setup Guide**

For complete environment setup instructions, see:
- **[ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)** - Comprehensive setup guide
- **[ENVIRONMENT_SEPARATION_PLAN.md](./ENVIRONMENT_SEPARATION_PLAN.md)** - Implementation plan
- **[SECURITY_AUDIT_2025-01-05.md](./SECURITY_AUDIT_2025-01-05.md)** - Security audit report

---

## 💾 **Save to Database Workflow**

### **User Experience**
1. Complete analysis of transcript
2. Review AI suggestions (edit if needed)
3. Click **"💾 Save to Database"** button
4. Review confirmation dialog:
   ```
   Save Analysis Results to Cloud Database?

   You're about to save 8 course exemption decisions:

     ✅ 8 subjects will be EXEMPTED
     ❌ 0 subjects need to be STUDIED

   📚 Example decisions:
      • HD401: LAN4442 English... → EXEMPTED ✓
      • GS407: CMV1171 Engineering Math... → EXEMPTED ✓

   💾 Storage Location: Supabase Cloud Database
   💡 Why save? This helps improve AI predictions for future students.

   Do you want to proceed?
   ```
5. Confirm → Data saved to cloud
6. Success message with summary

### **Why Manual Saves?**
- ✅ User verifies exemptions before saving
- ✅ Prevents incorrect AI predictions from polluting database
- ✅ Allows editing before committing
- ✅ Clear audit trail of intentional decisions

---

## 📊 **Data Flow**

```
User Uploads PDF
       ↓
PDF.js Extracts Text
       ↓
Gemini AI Analyzes
       ↓
Display Results (Editable)
       ↓
User Reviews/Edits
       ↓
User Clicks "Save to Database"
       ↓
Confirmation Dialog
       ↓
User Confirms
       ↓
Try Save to Supabase Cloud ☁️
       ↓ (if fails)
Try Save to PostgreSQL Server 🏥
       ↓ (if fails)
Save to IndexedDB (Browser) 📦
       ↓
Success Notification
```

---

## 🧪 **Testing**

### **Manual Testing**
1. Visit production site: https://hkit-course-analyzer-deploy.vercel.app/
2. Enter Gemini API key (legacy)
3. Upload sample transcript (see `Test/` folder)
4. Click "Analyze Files"
5. Verify results display correctly
6. Click "💾 Save to Database"
7. Confirm save dialog
8. Check Supabase Table Editor for saved data

### **Database Verification**
```bash
# Check saved data in Supabase
# 1. Go to: Supabase Dashboard → Table Editor
# 2. Select table: exemption_patterns
# 3. Verify new records appear
# 4. Select table: analysis_results
# 5. Verify complete analysis saved
```

---

## 🔄 **Backup & Maintenance**

### **Automated Backups**
- GitHub Actions workflow backs up Supabase daily
- Located: `.github/workflows/supabase-backup.yml`
- Runs: 2AM UTC (10AM Hong Kong Time)
- Storage: GitHub Artifacts (30-day retention)

**Manual Backup**: See `docs/deployment/SUPABASE_BACKUP_GUIDE.md`

### **Database Monitoring**
```sql
-- Check learning statistics
SELECT * FROM learning_stats_summary;

-- View recent analyses
SELECT * FROM recent_analyses LIMIT 10;

-- Check pattern effectiveness
SELECT * FROM pattern_analysis ORDER BY total_uses DESC;
```

---

## 📖 **Documentation**

### **For Users**
- `USER_GUIDE_SIMPLIFIED.md` - End-user instructions
- `UAT_TEST_CASES.md` - User acceptance test scenarios

### **For Developers**
- **`ENVIRONMENT_SETUP.md`** - Production and testing environment setup guide ⭐ NEW
- **`ENVIRONMENT_SEPARATION_PLAN.md`** - Environment separation implementation plan ⭐ NEW
- `docs/development/PRD_LEARNING_DATABASE.md` - Database design & PRD
- `docs/deployment/SUPABASE_VERCEL_SETUP_SOP.md` - Deployment guide
- `docs/deployment/SUPABASE_BACKUP_GUIDE.md` - Backup procedures
- `MASTER_PRD.md` - Master product requirements

### **For Administrators**
- **`SECURITY_AUDIT_2025-01-05.md`** - Security audit report ⭐ NEW
- `BACKEND_SETUP_GUIDE.md` - Backend configuration
- `TESTING_GUIDE.md` - Testing procedures
- `PROJECT_JOURNEY_REPORT.md` - Development history

---

## 🐛 **Troubleshooting**

### **"Cloud database connection failed"**
- Check Supabase credentials in `config/supabase-config.js`
- Verify Supabase project is active
- Check browser console for detailed errors
- **Fallback**: System automatically uses IndexedDB

### **"No analysis results to save"**
- Ensure transcript analysis completed successfully
- Check that results are displayed on screen
- Try analyzing again

### **"Save to Database button not visible"**
- Button only appears after successful analysis
- During edit mode, button is hidden (save edits first)
- Check browser console for JavaScript errors

### **API Key Issues**
- Verify key is valid: https://makersuite.google.com/app/apikey
- Clear browser cache and re-enter key
- Check API usage limits in Google Console

---

## 👥 **Support & Contact**

**Technical Support**: stevenkok@hkit.edu.hk
**GitHub Issues**: https://github.com/kmkaiuse-bit/hkit-course-analyzer-deploy/issues
**Documentation**: See `docs/` folder for detailed guides

---

## 📜 **License**

© 2025 Hong Kong Institute of Technology - Course Exemption Analyzer
All rights reserved.

---

## 🙏 **Acknowledgments**

- **Google Gemini AI**: Powering intelligent course matching
- **Supabase**: Cloud database infrastructure
- **Vercel**: Serverless deployment platform
- **PDF.js**: Client-side PDF processing
- **HKIT**: Hong Kong Institute of Technology

---

**Last Updated**: January 2025
**Version**: 2.1 (Supabase Integration + Environment Separation)
**Status**: Production Ready ✅
