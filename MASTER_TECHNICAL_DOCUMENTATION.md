# 🔧 HKIT Course Analyzer - Master Technical Documentation

**Version:** 3.0.0 | **Last Updated:** September 2025 | **For Developers**

---

## 📖 Table of Contents

1. [System Overview](#-system-overview)
2. [Architecture & Technology Stack](#-architecture--technology-stack)
3. [Codebase Structure](#-codebase-structure)
4. [Core Systems](#-core-systems)
5. [Development Environment](#-development-environment)
6. [Database Architecture](#-database-architecture)
7. [API Documentation](#-api-documentation)
8. [Deployment Configurations](#-deployment-configurations)
9. [Development Workflow](#-development-workflow)
10. [Testing Strategy](#-testing-strategy)
11. [Performance Optimization](#-performance-optimization)
12. [Troubleshooting Guide](#-troubleshooting-guide)
13. [Extension Guidelines](#-extension-guidelines)

---

## 🎯 System Overview

### What We're Building
An AI-powered web application that automates Advanced Standing Application processing for HKIT students by:
- Analyzing student transcripts (PDF/Excel)
- Matching courses using Google Gemini AI
- Learning from decisions to improve accuracy over time
- Generating exemption recommendations with 92% accuracy
- Reducing processing time from 2-3 hours to 5 minutes

### Key Business Value
- **85% Time Reduction**: Automated course exemption analysis
- **Smart Learning**: Pattern recognition improves accuracy over time
- **Compliance Automation**: Enforces 50% maximum exemption rule
- **Multi-Format Support**: PDF OCR, Excel parsing, CSV export

### Current Capabilities
- 7 Academic Programs (4 University + 3 Diploma + AI Diploma)
- Smart Pattern Matching (50-70% token reduction)
- Time-Weighted Confidence System
- PostgreSQL Learning Database
- Real-time Edit Mode
- Multi-format Export (Excel, PDF, CSV, JSON)

---

## 🏗️ Architecture & Technology Stack

### Frontend Architecture
```
Browser Application (Vanilla JS)
├── PDF.js → OCR Processing
├── TailwindCSS → Responsive UI
├── Smart Pattern Matcher → Learning Engine
└── Gemini API Client → AI Analysis
```

### Backend Architecture
```
Dual Deployment Model:
├── Production (Vercel Functions)
│   ├── Serverless Functions
│   ├── Environment Variables
│   └── Global CDN
└── Local Enhanced Mode
    ├── Express.js API Server (Port 3001)
    ├── PostgreSQL Database
    └── Full Learning Capabilities
```

### Technology Stack
- **Frontend**: Vanilla JavaScript ES6+, HTML5, CSS3, TailwindCSS
- **PDF Processing**: PDF.js with OCR capabilities
- **AI Engine**: Google Gemini 2.5 Pro (gemini-2.5-pro-002)
- **Learning Database**: PostgreSQL 17
- **API Server**: Express.js 4.18.2
- **Testing**: Jest 29.7.0 with JSDOM
- **Deployment**: Vercel Functions + Local Express Server

### External Dependencies
```json
{
  "@google/generative-ai": "^0.21.0",  // Gemini AI SDK
  "pg": "^8.16.3",                     // PostgreSQL client
  "express": "^4.18.2",               // API server
  "cors": "^2.8.5",                   // Cross-origin support
  "dotenv": "^17.2.2"                 // Environment variables
}
```

---

## 📁 Codebase Structure

### Root Directory Layout
```
hkit-course-analyzer/
├── 📄 Production Files
│   ├── index.html                           # Vercel production app
│   └── api/gemini.js                       # Serverless function
│
├── 🏠 Local Development
│   ├── local/enhanced.html                  # Full-featured local app
│   ├── local/assets/js/                    # Core JavaScript modules
│   ├── local/config/                       # Configuration files
│   └── start-local-enhanced.bat            # Quick start script
│
├── 🗄️ Learning Database System
│   ├── server/learning-server.js           # Express.js API (Port 3001)
│   ├── local/assets/js/db/                # Database modules
│   └── local/assets/js/learning-client.js  # Browser API client
│
├── 🧪 Development Tools
│   ├── tests/                              # Jest test suites
│   ├── view-database-data.js               # Database inspection
│   ├── export-database.js                 # Data export utility
│   └── clear-database.js                  # Database reset
│
└── 📚 Documentation
    ├── docs/                               # Technical guides
    ├── MASTER_PRD.md                      # Product requirements
    ├── CLAUDE.md                          # AI assistant guidance
    └── MASTER_TECHNICAL_DOCUMENTATION.md  # This file
```

### Core JavaScript Modules

#### Frontend Core (`local/assets/js/`)
```
📦 Core Application
├── app.js                    # Main controller & initialization
├── templates.js              # Programme data & course templates
├── utils.js                  # Helper utilities & common functions
└── file-handler.js           # File upload & validation

🤖 AI & Processing
├── gemini-api.js             # Gemini API integration & prompts
├── smart-pattern-matcher.js  # Learning engine integration
└── results-display.js        # Results formatting & visualization

💾 Data Management
├── export-manager.js         # Multi-format export functions
└── learning-client.js        # Database API client

🔧 Advanced Features
└── modules/
    ├── studentInfoManager.js    # Student data handling
    ├── advancedExporter.js      # Complex export logic
    ├── editModeController.js    # Interactive editing
    ├── notificationManager.js   # User notifications
    ├── debugMonitor.js          # Development debugging
    ├── subjectCollector.js      # Course extraction
    ├── dataManager.js           # Data persistence
    ├── storageManager.js        # Browser storage
    └── errorHandler.js          # Error management
```

#### Learning Database (`local/assets/js/db/`)
```
🧠 Learning System
├── learning-engine.js        # Main learning coordinator
├── connection.js             # PostgreSQL connection manager
├── pattern-recorder.js       # Decision recording logic
└── pattern-retriever.js      # Pattern matching queries
```

#### API Server (`server/`)
```
🌐 Express.js API
└── learning-server.js        # RESTful API for learning database
```

---

## ⚙️ Core Systems

### 1. Smart Pattern Matching System

**Purpose**: Learns from historical exemption decisions to reduce AI API calls and improve consistency.

**How It Works**:
```javascript
// Pattern Recognition Flow
1. Extract subjects from transcript → regex patterns
2. Query database for matching patterns → confidence scores
3. Auto-apply patterns >90% confidence → no AI needed
4. Send hints to AI for 50-90% → guided analysis
5. Let AI decide freely for <50% → full analysis
```

**Key Configuration** (`smart-pattern-matcher.js`):
```javascript
config: {
    AUTO_APPLY_THRESHOLD: 0.90,    // Auto-apply >90% confidence
    STRONG_HINT_THRESHOLD: 0.70,   // Strong hints 70-90%
    WEAK_HINT_THRESHOLD: 0.50,     // Weak hints 50-70%
    MIN_SAMPLE_SIZE: 2,            // Min observations for auto-apply
    MAX_PATTERNS_IN_PROMPT: 15     // Limit patterns in AI prompt
}
```

**Time-Weighted Confidence**:
```javascript
// Recent decisions carry more weight
weight = 0.99^days_since_decision
// 99% retention factor per day
```

### 2. AI Integration System

**Gemini API Configuration** (`gemini-api.js`):
```javascript
// Current Model Configuration
model: 'gemini-2.5-pro-002'
temperature: 0.3  // Consistent academic analysis
topP: 0.9         // Focused responses
maxOutputTokens: 8192
```

**Prompt Engineering Strategy**:
- **Context-Aware**: Program-specific requirements
- **Pattern-Enhanced**: Incorporates learned patterns as hints
- **Compliance-Focused**: Enforces 50% exemption rule
- **Justification-Required**: Detailed reasoning for decisions

### 3. Learning Database System

**Database Schema**:
```sql
-- Main Pattern Storage
CREATE TABLE exemption_patterns (
    id SERIAL PRIMARY KEY,
    previous_subject VARCHAR(500),      -- Course from transcript
    hkit_subject VARCHAR(20),          -- HKIT course code
    confidence DECIMAL(5,4),           -- Traditional confidence
    weighted_confidence DECIMAL(5,4),  -- Time-weighted confidence
    exemption_rate DECIMAL(5,4),      -- Success percentage
    times_seen INTEGER,               -- Total observations
    programme_context VARCHAR(20),    -- Programme code
    first_seen TIMESTAMP,
    last_updated TIMESTAMP
);

-- Decision History for Time-Weighting
CREATE TABLE decision_history (
    id SERIAL PRIMARY KEY,
    pattern_id INTEGER REFERENCES exemption_patterns(id),
    decision_timestamp TIMESTAMP,
    exemption_granted BOOLEAN,
    ai_confidence DECIMAL(5,4),
    programme_code VARCHAR(20)
);
```

### 4. Export System

**Multi-Format Support**:
- **Excel**: Color-coded spreadsheets with formulas
- **PDF**: Professional reports with HKIT branding
- **CSV**: Data analysis and record keeping
- **JSON**: System integration and data migration

**Export Implementation** (`export-manager.js`):
```javascript
// Export Types
exportFormats: {
    excel: 'advancedExporter.generateExcel()',
    pdf: 'advancedExporter.generatePDF()',
    csv: 'advancedExporter.generateCSV()',
    json: 'JSON.stringify(data, null, 2)'
}
```

---

## 🛠️ Development Environment

### Prerequisites
```bash
# Required Software
Node.js >= 18.0.0
PostgreSQL 17
Git
Modern Browser (Chrome/Firefox/Safari)

# Optional but Recommended
VS Code with extensions:
- JavaScript (ES6) code snippets
- PostgreSQL syntax highlighting
- Jest test runner
```

### Quick Setup
```bash
# 1. Clone and Install
git clone <repository>
cd hkit-course-analyzer
npm install

# 2. Database Setup
createdb -U postgres hkit_learning_db
psql -U postgres -d hkit_learning_db < schema.sql

# 3. Environment Configuration
cp .env.example .env
# Edit .env with your database credentials

# 4. Start Development Servers
npm run server  # API server (port 3001)
python -m http.server 8000  # Web server (port 8000)

# 5. Access Application
# http://localhost:8000/local/enhanced.html
```

### Environment Variables
```bash
# Local Development (.env)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hkit_learning_db
DB_USER=hkit_admin
DB_PASSWORD=hkit123
LEARNING_ENABLED=true
LEARNING_SERVER_PORT=3001

# Production (Vercel)
GEMINI_API_KEY=your-api-key-here
```

### Development Commands
```bash
# Learning System
npm run server           # Start API server (port 3001)
npm run dev             # Alias for server
npm start               # Production server start

# Database Management
node view-database-data.js     # View learning patterns
node export-database.js       # Export pattern data to CSV
node clear-database.js        # Reset learning database
node migrate-to-weighted-confidence.js  # Schema updates

# Testing
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
npm run test:api        # API tests only
npm run test:frontend   # Frontend tests only

# Development Tools
python -m http.server 8000     # Web server for local testing
start start-local-enhanced.bat # Windows quick start
```

---

## 🗄️ Database Architecture

### Connection Management (`connection.js`)
```javascript
// PostgreSQL Configuration
const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hkit_learning_db',
    user: process.env.DB_USER || 'hkit_admin',
    password: process.env.DB_PASSWORD || 'hkit123',
    max: 20,                    // Connection pool size
    idleTimeoutMillis: 30000,   // Idle timeout
    connectionTimeoutMillis: 2000  // Connection timeout
};
```

### Learning Engine Workflow
```javascript
// Pattern Recording Process
1. recordDecision(previousSubject, hkitSubject, programmeCode, exemptionGranted)
   ↓
2. Check if pattern exists → UPDATE or INSERT
   ↓
3. Update confidence scores (traditional + time-weighted)
   ↓
4. Record in decision_history for future time-weighting
   ↓
5. Return updated pattern statistics
```

### Database Operations

#### Pattern Retrieval (`pattern-retriever.js`):
```javascript
// Smart Pattern Matching Query
async function getMatchingPatterns(subjects, programmeCode) {
    const query = `
        SELECT
            previous_subject,
            hkit_subject,
            weighted_confidence,
            exemption_rate,
            times_seen
        FROM exemption_patterns
        WHERE programme_context = $1
        AND previous_subject ILIKE ANY($2)
        AND times_seen >= $3
        ORDER BY weighted_confidence DESC
        LIMIT $4
    `;
    // Returns patterns ordered by confidence
}
```

#### Pattern Recording (`pattern-recorder.js`):
```javascript
// Decision Recording with Time-Weighting
async function recordDecision(data) {
    // 1. Upsert exemption_patterns table
    // 2. Insert into decision_history
    // 3. Recalculate time-weighted confidence
    // 4. Update pattern statistics
}
```

### Database Maintenance
```bash
# View Database Statistics
node view-database-data.js
# Shows: Total patterns, confidence distribution, programme breakdown

# Export Learning Data
node export-database.js
# Generates: patterns_export_YYYY-MM-DD.csv

# Reset Database (Development Only)
node clear-database.js
# Prompts for confirmation before clearing all data

# Database Health Check
curl http://localhost:3001/api/health
# Returns connection status and database info
```

---

## 🌐 API Documentation

### Learning Database API Endpoints

**Base URL**: `http://localhost:3001/api`

#### Health Check
```http
GET /api/health
Response: {
    "status": "ok",
    "timestamp": "2025-09-17T10:30:00Z",
    "server": "learning-api",
    "database": { "connected": true, "version": "17.0" }
}
```

#### Pattern Retrieval
```http
POST /api/patterns/retrieve
Content-Type: application/json

Request Body: {
    "subjects": ["Mathematics", "English"],
    "programmeCode": "BA40102E",
    "minConfidence": 0.5
}

Response: {
    "patterns": [
        {
            "previousSubject": "Mathematics",
            "hkitSubject": "MTH101",
            "confidence": 0.92,
            "exemptionRate": 0.85,
            "timesSeen": 15
        }
    ],
    "autoApplyCount": 1,
    "hintCount": 0
}
```

#### Pattern Recording
```http
POST /api/patterns/record
Content-Type: application/json

Request Body: {
    "previousSubject": "Advanced Mathematics",
    "hkitSubject": "MTH201",
    "programmeCode": "BA40102E",
    "exemptionGranted": true,
    "aiConfidence": 0.87
}

Response: {
    "success": true,
    "patternId": 123,
    "updatedConfidence": 0.89,
    "timesSeen": 8
}
```

#### Database Statistics
```http
GET /api/patterns/stats

Response: {
    "totalPatterns": 1547,
    "averageConfidence": 0.73,
    "programmeBreakdown": {
        "BA40102E": 423,
        "BA40103E": 389,
        "HD_CYBER": 267
    },
    "recentActivity": {
        "decisionsToday": 23,
        "decisionsThisWeek": 156
    }
}
```

### Gemini API Integration

**Production Endpoint**: `/api/gemini.js` (Vercel Function)
**Local Endpoint**: Direct API calls from `gemini-api.js`

#### Request Flow
```javascript
// 1. Prepare Prompt with Context
const prompt = createPrompt(transcriptData, programmeTemplate, patterns);

// 2. Send to Gemini API
const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.3,
            topP: 0.9,
            maxOutputTokens: 8192
        }
    })
});

// 3. Process AI Response
const result = await response.json();
const exemptions = parseGeminiResponse(result);

// 4. Record Decisions in Database
await recordPatterns(exemptions, programmeCode);
```

---

## 🚀 Deployment Configurations

### Production Deployment (Vercel)

**File Structure**:
```
Vercel Deployment:
├── index.html              # Main application
├── api/gemini.js           # Serverless function
├── assets/js/              # Frontend code
└── vercel.json             # Deployment config
```

**Environment Variables** (Vercel Dashboard):
```bash
GEMINI_API_KEY=your_api_key_here
```

**Deployment Commands**:
```bash
# Deploy to Vercel
vercel --prod

# Or using GitHub integration
git push origin main  # Auto-deploys to production
```

### Local Enhanced Mode

**Advantages**:
- Complete offline functionality
- Full learning database access
- No timeout limitations
- Direct API configuration
- Development debugging tools

**Quick Start**:
```bash
# Windows
start-local-enhanced.bat

# Manual Start
npm run server &
python -m http.server 8000
# Open: http://localhost:8000/local/enhanced.html
```

**Configuration** (`local/config/api-config.js`):
```javascript
const CONFIG = {
    GEMINI_API_KEY: 'your-api-key-here',
    LEARNING_ENABLED: true,
    LEARNING_API_URL: 'http://localhost:3001/api',
    DEBUG_MODE: true,
    AUTO_SAVE_PATTERNS: true
};
```

---

## 🔄 Development Workflow

### 1. Feature Development Process

```bash
# 1. Create Feature Branch
git checkout -b feature/new-exemption-logic

# 2. Start Development Environment
npm run server  # Terminal 1
python -m http.server 8000  # Terminal 2

# 3. Develop and Test
# Edit files in local/assets/js/
# Test at http://localhost:8000/local/enhanced.html

# 4. Run Tests
npm test
npm run test:coverage

# 5. Commit and Push
git add .
git commit -m "Add new exemption logic"
git push origin feature/new-exemption-logic

# 6. Deploy to Production
# Merge to main branch triggers Vercel deployment
```

### 2. Adding New Academic Programmes

**Step 1**: Edit `templates.js`
```javascript
// Add new programme to programmes array
programmes.push({
    code: 'BA40105E',
    name: 'Bachelor of Arts (Hons) Digital Marketing',
    type: 'university',
    totalCredits: 120,
    courses: [
        {
            code: 'MKT101',
            name: 'Digital Marketing Fundamentals',
            credits: 3,
            category: 'Core'
        }
        // ... more courses
    ]
});
```

**Step 2**: Update AI Prompts
```javascript
// gemini-api.js - Add programme-specific logic
function createPrompt(transcriptData, programmeTemplate, patterns) {
    // Programme-specific exemption rules
    if (programmeTemplate.code === 'BA40105E') {
        prompt += "\n\nSpecial consideration for digital marketing competencies...";
    }
}
```

**Step 3**: Test with Sample Data
```bash
# Use test files in assets/images/
# Test exemption logic thoroughly
# Verify 50% maximum exemption rule
```

### 3. Modifying Learning Algorithm

**Pattern Confidence Tuning** (`smart-pattern-matcher.js`):
```javascript
// Adjust thresholds based on performance data
config: {
    AUTO_APPLY_THRESHOLD: 0.95,  // Increase for higher accuracy
    STRONG_HINT_THRESHOLD: 0.80, // Adjust hint sensitivity
    MIN_SAMPLE_SIZE: 5           // Require more observations
}
```

**Time-Weight Decay** (`pattern-recorder.js`):
```javascript
// Modify daily retention factor
const DAILY_RETENTION_FACTOR = 0.99;  // 99% per day
// Or implement seasonal adjustments
const weight = Math.pow(DAILY_RETENTION_FACTOR, daysSince) * seasonalMultiplier;
```

### 4. Database Schema Changes

**Migration Process**:
```bash
# 1. Create migration script
node migrate-to-weighted-confidence.js

# 2. Backup existing data
node export-database.js

# 3. Apply schema changes
psql -U hkit_admin -d hkit_learning_db < new_schema.sql

# 4. Verify migration
node view-database-data.js
```

---

## 🧪 Testing Strategy

### Test Structure
```
tests/
├── unit/
│   ├── api/                 # Server-side unit tests
│   │   ├── learning-engine.test.js
│   │   ├── pattern-recorder.test.js
│   │   └── database-connection.test.js
│   └── frontend/            # Browser-side unit tests
│       ├── gemini-api.test.js
│       ├── smart-pattern-matcher.test.js
│       └── export-manager.test.js
├── integration/             # Full system tests
│   ├── api-integration.test.js
│   └── end-to-end.test.js
└── setup.js                # Test configuration
```

### Running Tests
```bash
# All Tests
npm test

# Specific Test Categories
npm run test:api        # API/Backend tests
npm run test:frontend   # Frontend/Browser tests
npm run test:integration # Integration tests

# Development Mode
npm run test:watch      # Auto-rerun on changes

# Coverage Report
npm run test:coverage   # Generate coverage/index.html
```

### Test Examples

**API Testing** (`learning-engine.test.js`):
```javascript
describe('Learning Engine', () => {
    test('should record exemption decision', async () => {
        const result = await LearningEngine.recordDecision({
            previousSubject: 'Test Mathematics',
            hkitSubject: 'MTH101',
            programmeCode: 'BA40102E',
            exemptionGranted: true
        });

        expect(result.success).toBe(true);
        expect(result.confidence).toBeGreaterThan(0);
    });
});
```

**Frontend Testing** (`smart-pattern-matcher.test.js`):
```javascript
describe('Smart Pattern Matcher', () => {
    test('should auto-apply high confidence patterns', () => {
        const patterns = [
            { confidence: 0.95, hkitSubject: 'MTH101' }
        ];

        const result = SmartPatternMatcher.processPatterns(patterns);
        expect(result.autoApplied).toHaveLength(1);
    });
});
```

### Performance Testing
```bash
# Load Testing
npm run test:load

# Memory Usage Analysis
node --inspect view-database-data.js

# Database Performance
EXPLAIN ANALYZE SELECT * FROM exemption_patterns
WHERE programme_context = 'BA40102E'
ORDER BY weighted_confidence DESC;
```

---

## ⚡ Performance Optimization

### 1. Frontend Optimization

**Lazy Loading Strategy**:
```javascript
// Load modules only when needed
async function loadAdvancedExporter() {
    if (!window.AdvancedExporter) {
        await import('./modules/advancedExporter.js');
    }
    return window.AdvancedExporter;
}
```

**Caching Strategy**:
```javascript
// Cache programme templates
const templateCache = new Map();

function getTemplate(programmeCode) {
    if (!templateCache.has(programmeCode)) {
        templateCache.set(programmeCode, loadTemplate(programmeCode));
    }
    return templateCache.get(programmeCode);
}
```

### 2. Database Performance

**Query Optimization**:
```sql
-- Index for pattern retrieval
CREATE INDEX idx_exemption_patterns_lookup
ON exemption_patterns (programme_context, weighted_confidence DESC);

-- Index for subject matching
CREATE INDEX idx_exemption_patterns_subject
ON exemption_patterns USING gin(to_tsvector('english', previous_subject));
```

**Connection Pooling** (`connection.js`):
```javascript
const pool = new Pool({
    max: 20,                    // Maximum connections
    idleTimeoutMillis: 30000,   // Close idle connections
    connectionTimeoutMillis: 2000  // Connection timeout
});
```

### 3. AI API Optimization

**Token Reduction Strategies**:
```javascript
// Smart pattern integration reduces tokens by 50-70%
function optimizePrompt(basePrompt, patterns) {
    const autoApplied = patterns.filter(p => p.confidence > 0.90);
    const hints = patterns.filter(p => p.confidence > 0.50 && p.confidence <= 0.90);

    // Only include top patterns in prompt
    const topHints = hints.slice(0, CONFIG.MAX_PATTERNS_IN_PROMPT);

    return basePrompt + formatHints(topHints);
}
```

**Response Caching**:
```javascript
// Cache identical transcript analyses
const responseCache = new Map();

function getCachedResponse(transcriptHash, programmeCode) {
    const key = `${transcriptHash}_${programmeCode}`;
    return responseCache.get(key);
}
```

### 4. Memory Management

**Large File Handling**:
```javascript
// Stream large PDF processing
async function processPDFStream(file) {
    const chunks = [];
    const stream = file.stream();

    for await (const chunk of stream) {
        chunks.push(chunk);
        // Process chunk immediately to reduce memory
        processChunk(chunk);
    }
}
```

**Garbage Collection**:
```javascript
// Clean up references after processing
function cleanupAfterAnalysis() {
    transcriptData = null;
    intermediateResults = null;
    if (global.gc) global.gc(); // Force garbage collection
}
```

---

## 🔧 Troubleshooting Guide

### Common Issues and Solutions

#### 1. Database Connection Issues

**Problem**: `Error: Connection refused to localhost:5432`
```bash
# Solution: Check PostgreSQL service
# Windows
net start postgresql-x64-17

# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Verify connection
psql -U postgres -d hkit_learning_db -c "SELECT version();"
```

#### 2. API Server Not Starting

**Problem**: `Error: EADDRINUSE :::3001`
```bash
# Solution: Kill existing process
# Windows
netstat -ano | findstr :3001
taskkill /PID <process_id> /F

# Unix
lsof -ti:3001 | xargs kill -9

# Start server
npm run server
```

#### 3. Gemini API Issues

**Problem**: `Error: API key not valid`
```javascript
// Solution: Check API key configuration
// 1. Verify key in Google AI Studio
// 2. Update configuration file
// local/config/api-config.js
const CONFIG = {
    GEMINI_API_KEY: 'your-correct-api-key'
};

// 3. Check network connectivity
curl -H "Content-Type: application/json" \
     -d '{"contents":[{"parts":[{"text":"test"}]}]}' \
     "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-002:generateContent?key=YOUR_API_KEY"
```

#### 4. Pattern Learning Not Working

**Problem**: Patterns not being saved or retrieved
```bash
# Diagnosis steps:
# 1. Check database tables exist
psql -U hkit_admin -d hkit_learning_db -c "\dt"

# 2. Check learning server status
curl http://localhost:3001/api/health

# 3. Check browser console for errors
# Open DevTools → Console → Look for learning errors

# 4. Verify learning client connection
# In browser console:
window.LearningClient?.healthCheck()
```

#### 5. Export Functions Failing

**Problem**: Excel/PDF export not working
```javascript
// Solution: Check dependencies and browser support
// 1. Verify advanced exporter module loaded
console.log(window.AdvancedExporter);

// 2. Check browser download permissions
// Settings → Privacy → Downloads → Allow

// 3. Debug export process
// Enable debug mode in config
const CONFIG = { DEBUG_MODE: true };
```

### Performance Issues

#### Slow Analysis Response
```javascript
// Diagnosis: Check performance bottlenecks
console.time('analysis');
// ... run analysis
console.timeEnd('analysis');

// Solutions:
// 1. Increase pattern auto-apply threshold
CONFIG.AUTO_APPLY_THRESHOLD = 0.95;

// 2. Reduce AI prompt size
CONFIG.MAX_PATTERNS_IN_PROMPT = 10;

// 3. Enable response caching
CONFIG.CACHE_AI_RESPONSES = true;
```

#### High Memory Usage
```bash
# Monitor memory usage
node --inspect-brk view-database-data.js
# Open chrome://inspect in Chrome

# Solutions:
# 1. Implement streaming for large files
# 2. Clear caches periodically
# 3. Optimize database queries
```

### Debug Mode

**Enable Comprehensive Debugging**:
```javascript
// local/config/api-config.js
const CONFIG = {
    DEBUG_MODE: true,
    LOG_LEVEL: 'debug',
    ENABLE_PERFORMANCE_MONITORING: true,
    LOG_AI_REQUESTS: true,
    LOG_DATABASE_QUERIES: true
};
```

**Browser Console Commands**:
```javascript
// Check system status
window.debugInfo();

// View learning statistics
window.LearningClient.getStats();

// Force pattern refresh
window.SmartPatternMatcher.refreshPatterns();

// Export debug logs
window.DebugMonitor.exportLogs();
```

---

## 🔗 Extension Guidelines

### Adding New Features

#### 1. New Export Format
```javascript
// Step 1: Extend AdvancedExporter class
class AdvancedExporter {
    static async generateXML(data, options) {
        // XML generation logic
        const xmlContent = this.buildXMLStructure(data);
        return this.downloadFile(xmlContent, 'transcript.xml', 'text/xml');
    }
}

// Step 2: Update export manager
// export-manager.js
exportFormats: {
    xml: () => AdvancedExporter.generateXML(this.data)
}

// Step 3: Add UI button
// enhanced.html
<button onclick="exportManager.export('xml')">Export XML</button>
```

#### 2. New Academic Programme Type
```javascript
// Step 1: Define new programme structure
const newProgramme = {
    code: 'MSC40101E',
    name: 'Master of Science in Data Science',
    type: 'postgraduate',  // New type
    totalCredits: 180,     // Different credit system
    exemptionRules: {
        maxPercentage: 0.30,  // 30% max for postgraduate
        requiredCourses: ['DSC601', 'DSC602']  // Must take certain courses
    }
};

// Step 2: Update exemption logic
// gemini-api.js
function createPrompt(transcriptData, programmeTemplate, patterns) {
    if (programmeTemplate.type === 'postgraduate') {
        prompt += "\n\nPostgraduate-specific exemption rules:\n";
        prompt += "- Maximum 30% exemptions allowed\n";
        prompt += "- Research methodology courses cannot be exempted\n";
    }
}
```

#### 3. New Learning Algorithm
```javascript
// Step 1: Create new pattern matcher
class SemanticPatternMatcher extends SmartPatternMatcher {
    async getSemanticSimilarity(subject1, subject2) {
        // Use semantic similarity APIs or local models
        return similarityScore;
    }

    async enhancedPatternMatching(subjects, programmeCode) {
        const patterns = await super.getMatchingPatterns(subjects, programmeCode);

        // Apply semantic enhancement
        for (const pattern of patterns) {
            pattern.semanticConfidence = await this.getSemanticSimilarity(
                subjects[0], pattern.previousSubject
            );
        }

        return patterns;
    }
}

// Step 2: Integrate with main system
// smart-pattern-matcher.js
if (CONFIG.ENABLE_SEMANTIC_MATCHING) {
    matcher = new SemanticPatternMatcher();
} else {
    matcher = new SmartPatternMatcher();
}
```

### Integration Points

#### Database Extensions
```sql
-- Add new columns for enhanced features
ALTER TABLE exemption_patterns ADD COLUMN semantic_score DECIMAL(5,4);
ALTER TABLE exemption_patterns ADD COLUMN difficulty_level INTEGER;
ALTER TABLE exemption_patterns ADD COLUMN subject_category VARCHAR(50);

-- Create new tables for extensions
CREATE TABLE programme_rules (
    id SERIAL PRIMARY KEY,
    programme_code VARCHAR(20),
    rule_type VARCHAR(50),
    rule_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### API Extensions
```javascript
// server/learning-server.js
// Add new endpoints for enhanced features

// Semantic similarity endpoint
app.post('/api/semantic/similarity', async (req, res) => {
    const { subject1, subject2 } = req.body;
    const similarity = await semanticEngine.calculateSimilarity(subject1, subject2);
    res.json({ similarity });
});

// Programme rules endpoint
app.get('/api/programmes/:code/rules', async (req, res) => {
    const rules = await db.getProgrammeRules(req.params.code);
    res.json({ rules });
});
```

### Best Practices for Extensions

#### Code Organization
```javascript
// 1. Use modular architecture
// Create new files in modules/ directory
// local/assets/js/modules/newFeature.js

// 2. Follow naming conventions
class NewFeatureManager {
    constructor() {
        this.config = CONFIG.NEW_FEATURE || {};
    }
}

// 3. Implement proper error handling
try {
    const result = await newFeature.process();
    return result;
} catch (error) {
    ErrorHandler.log('NewFeature', error);
    throw new Error(`New feature failed: ${error.message}`);
}
```

#### Configuration Management
```javascript
// Add feature flags to config
const CONFIG = {
    FEATURES: {
        SEMANTIC_MATCHING: false,
        ADVANCED_ANALYTICS: true,
        MULTILINGUAL_SUPPORT: false
    },
    NEW_FEATURE: {
        ENABLED: true,
        THRESHOLD: 0.8,
        MAX_RESULTS: 20
    }
};
```

#### Testing Extensions
```javascript
// Create comprehensive tests for new features
// tests/unit/frontend/new-feature.test.js
describe('New Feature', () => {
    beforeEach(() => {
        // Setup test environment
    });

    test('should process data correctly', async () => {
        const result = await NewFeature.process(testData);
        expect(result).toBeDefined();
    });

    test('should handle errors gracefully', async () => {
        expect(() => NewFeature.process(invalidData))
            .rejects.toThrow('Invalid data');
    });
});
```

---

## 📝 Maintenance Notes

### Regular Maintenance Tasks

#### Database Maintenance
```bash
# Weekly: Analyze database performance
psql -U hkit_admin -d hkit_learning_db -c "ANALYZE;"

# Monthly: Clean old decision history
psql -U hkit_admin -d hkit_learning_db -c "
DELETE FROM decision_history
WHERE decision_timestamp < NOW() - INTERVAL '1 year';"

# Quarterly: Rebuild indexes
psql -U hkit_admin -d hkit_learning_db -c "REINDEX DATABASE hkit_learning_db;"
```

#### Learning System Optimization
```bash
# Review pattern confidence distribution
node view-database-data.js

# Export patterns for analysis
node export-database.js

# Update confidence thresholds based on performance
# Edit smart-pattern-matcher.js config values
```

#### API Key Management
```bash
# Rotate API keys quarterly
# 1. Generate new key in Google AI Studio
# 2. Update environment variables
# 3. Test functionality
# 4. Revoke old key
```

### Version Control Strategy
```bash
# Feature branches for new development
git checkout -b feature/new-programme-support

# Hotfix branches for urgent fixes
git checkout -b hotfix/api-timeout-fix

# Release branches for version preparation
git checkout -b release/v3.1.0

# Tags for version tracking
git tag -a v3.0.0 -m "Production release with smart learning"
```

### Backup Strategy
```bash
# Database backup (daily recommended)
pg_dump -U hkit_admin hkit_learning_db > backup_$(date +%Y%m%d).sql

# Code backup (automated via Git)
git push origin main

# Configuration backup
cp local/config/api-config.js backups/api-config-$(date +%Y%m%d).js
```

---

**Document Maintained By**: HKIT Development Team
**Last Updated**: September 2025
**Next Review**: December 2025

---

*This document serves as the definitive technical guide for the HKIT Course Analyzer. For questions or contributions, please refer to the development team or create an issue in the project repository.*