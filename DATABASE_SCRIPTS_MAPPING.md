# Smart Learning Database: Scripts & Files Mapping

**Complete guide to database READ and WRITE operations**

---

## Overview

The smart learning database system consists of **9 key files** organized into:
- **Database Layer** (Schema, Connection, Core Operations)
- **Server Layer** (API Server)
- **Client Layer** (Browser Integration)
- **Integration Layer** (AI & Pattern Matching)

---

## Database Layer

### 1. Schema Definition

**File:** `local/assets/js/db/schema.sql`
**Purpose:** Database structure and tables
**Type:** Schema/Setup

**What it defines:**

**Main Table: `exemption_patterns`**
- Stores learned course pairings
- Fields:
  - `hkit_subject` - HKIT course code
  - `previous_subject` - Student's course name
  - `previous_normalized` - Cleaned version for matching
  - `times_seen` - How many times encountered
  - `times_exempted` - How many times exempted
  - `times_rejected` - How many times rejected
  - `confidence` - Traditional confidence score
  - `weighted_confidence` - Time-weighted score (recent = more weight)
  - `programme_context` - Which program this applies to
  - `metadata` - Extra information in JSON format

**History Table: `decision_history`**
- Tracks individual decisions for time-weighting
- Links to exemption_patterns
- Records decision date and context

**View: `pattern_analysis`**
- Quick analysis combining both confidence scores
- Shows "effective_confidence" (best of traditional or weighted)

---

### 2. Database Connection

**File:** `local/assets/js/db/connection.js`
**Purpose:** Connect to PostgreSQL database
**Type:** Infrastructure

**Key Functions:**
- `connect()` - Initialize database connection
- `query()` - Execute database queries
- `healthCheck()` - Test connection status
- `getStats()` - Get overall database statistics

**Configuration:** Reads from environment variables (DB_HOST, DB_PORT, DB_NAME, etc.)

---

### 3. Pattern Recording (WRITE Operations)

**File:** `local/assets/js/db/pattern-recorder.js`
**Purpose:** Save exemption decisions to database
**Type:** WRITE

**Main Functions:**

**`recordExemptionDecision()`**
- **What it does:** Saves a single exemption decision
- **Process:**
  1. Cleans up the subject name
  2. Checks if this pattern already exists
  3. If new: Creates new pattern record
  4. If exists: Updates the counts (times_seen, times_exempted/rejected)
  5. Saves decision to history table
  6. Recalculates confidence scores
- **Used by:** System after AI analysis or human review

**`calculateConfidence()`**
- **What it does:** Calculate traditional confidence score
- **Formula:** Based on success rate with sample size penalty
- **Example:** 9 exempted out of 10 seen = 90% confidence

**`calculateTimeWeightedConfidence()`**
- **What it does:** Calculate confidence with time decay
- **How:** Recent decisions weighted more heavily (0.99^days_old)
- **Example:**
  - Decision today = 100% weight
  - Decision 30 days ago = 74% weight
  - Decision 90 days ago = 40% weight

**`recordAnalysisResults()`**
- **What it does:** Save multiple decisions at once (bulk operation)
- **Used by:** After completing a full analysis

**`getLearningStats()`**
- **What it does:** Get statistics about learned patterns
- **Returns:** Total patterns, high/medium confidence counts, averages

---

### 4. Pattern Retrieval (READ Operations)

**File:** `local/assets/js/db/pattern-retriever.js`
**Purpose:** Query and retrieve learned patterns
**Type:** READ

**Main Functions:**

**`getRelevantPatterns()`**
- **What it does:** Find patterns matching student's subjects
- **Input:** List of student subjects, minimum confidence threshold
- **Returns:** All matching patterns with confidence scores
- **Used by:** Smart pattern matcher, learning engine

**`getTopMatchingHKITSubjects()`**
- **What it does:** Find most common HKIT courses for given subjects
- **Returns:** Ranked list of HKIT courses with statistics

**`generateLearningContext()`**
- **What it does:** Create learning hints for AI
- **Process:**
  1. Find relevant patterns
  2. Group by confidence level (high/medium/low)
  3. Format into readable summary
- **Used by:** AI prompt enhancement (Stage 1)

**`formatLearningContextForPrompt()`**
- **What it does:** Format patterns into text for AI prompt
- **Output sections:**
  - HIGH CONFIDENCE patterns (>= 70%)
  - MODERATE CONFIDENCE patterns (40-70%)
  - PROGRAMME-SPECIFIC patterns
- **Used by:** AI prompt builder

**`getDashboardStats()`**
- **What it does:** Get comprehensive statistics for dashboard
- **Returns:**
  - Confidence level distributions
  - Average scores
  - Decision history
  - Pattern insights
- **Used by:** Dashboard UI

---

### 5. Learning Engine (Orchestration)

**File:** `local/assets/js/db/learning-engine.js`
**Purpose:** Coordinate all database operations
**Type:** BOTH (READ + WRITE orchestration)

**Key Functions:**

**`initialize()`**
- **What it does:** Start up the learning system
- **Process:** Connect to database, check settings

**`gatherLearningContext()` - STAGE 1 (READ)**
- **What it does:** Get learning patterns during subject extraction
- **Process:** Call pattern retriever, store results
- **Used by:** Before AI analysis

**`enhanceAnalysisPrompt()` - STAGE 2 (READ)**
- **What it does:** Add learning patterns to AI prompt
- **Process:** Retrieve stored patterns, append to prompt
- **Used by:** During AI analysis

**`recordAnalysisResults()` - POST-STAGE 2 (WRITE)**
- **What it does:** Save analysis results for learning
- **Process:**
  1. Filter valid patterns
  2. Call pattern recorder
  3. Update confidence scores
- **Used by:** After AI analysis completes

**`getSystemStatus()` (READ)**
- **What it does:** Get current learning system status
- **Returns:** Connection status, pattern count, statistics

---

## Server Layer

### 6. API Server

**File:** `server/learning-server.js`
**Purpose:** Express.js server providing database access via HTTP
**Type:** BOTH (Provides READ + WRITE endpoints)

**Server Info:**
- Port: 3001 (default)
- Protocol: HTTP with CORS enabled
- Max request size: 50MB

**READ Endpoints:**

**`GET /api/health`**
- Check server and database status

**`GET /api/learning/status`**
- Get learning system status

**`POST /api/learning/context`** (Stage 1)
- Get learning patterns for subjects
- Input: Student subjects, program
- Returns: Relevant patterns

**`POST /api/learning/enhance`** (Stage 2)
- Enhance AI prompt with patterns
- Input: Original prompt, program
- Returns: Enhanced prompt

**`GET /api/learning/dashboard`**
- Get dashboard statistics
- Returns: Comprehensive stats

**`POST /api/learning/patterns`**
- Get specific patterns
- Input: Subjects, confidence threshold
- Returns: Matching patterns

**WRITE Endpoints:**

**`POST /api/learning/record`** (Post-Stage 2)
- Record analysis results
- Input: Analysis results, program
- Returns: Number of patterns saved

---

## Client Layer

### 7. Browser API Client

**File:** `local/assets/js/learning-client.js`
**Purpose:** Browser-side wrapper for API calls
**Type:** BOTH (Calls READ + WRITE endpoints)

**Connection Methods:**
- `constructor()` - Initialize client with server URL
- `checkHealth()` - Test connection
- `getSystemStatus()` - Get status

**READ Methods:**
- `gatherLearningContext()` - Get patterns (Stage 1)
- `enhancePrompt()` - Enhance AI prompt (Stage 2)
- `getDashboardStats()` - Get statistics
- `getRelevantPatterns()` - Query patterns

**WRITE Methods:**
- `recordAnalysisResults()` - Save analysis results (Post-Stage 2)

**Status Methods:**
- `isServerConnected()` - Check connection
- `getLastError()` - Get error details

---

## Integration Layer

### 8. Smart Pattern Matcher

**File:** `local/assets/js/smart-pattern-matcher.js`
**Purpose:** Auto-apply high-confidence patterns, optimize AI usage
**Type:** READ (uses patterns to make decisions)

**Configuration Thresholds:**
- **90%+ confidence:** Auto-apply (no AI needed)
- **70-90% confidence:** Strong hint to AI
- **50-70% confidence:** Weak hint to AI
- **Below 50%:** Full AI analysis required

**Key Functions:**

**`processWithPatterns()`**
- **What it does:** Process subjects using learned patterns
- **Output:**
  - Pre-applied results (auto-exempted based on high confidence)
  - Pending for AI (courses needing analysis)
  - Strong hints (high-confidence suggestions for AI)
  - Weak hints (medium-confidence suggestions for AI)

**`findBestPattern()`**
- **What it does:** Find best matching pattern for a course
- **Uses:** Fuzzy matching (exact, contains, word overlap)

**`generateOptimizedPrompt()`**
- **What it does:** Create AI prompt with learning context
- **Sections:**
  - PRE-APPLIED EXEMPTIONS (don't re-analyze)
  - COURSES REQUIRING ANALYSIS (focus here)
  - STRONG PATTERNS (prioritize these)
  - SUGGESTIONS (consider these)
- **Benefit:** 50-70% fewer AI tokens needed

**`mergeResults()`**
- **What it does:** Combine auto-applied + AI results
- **Returns:** Complete analysis

---

### 9. AI Integration

**File:** `local/assets/js/gemini-api.js`
**Purpose:** AI analysis with smart pattern integration
**Type:** READ (for enhancement) + triggers WRITE (after analysis)

**Main Integration:**

**`analyzeTranscripts()` - Main Analysis Flow**

**Process:**
1. Extract subjects from transcript
2. Check if learning client available
3. If yes:
   - Get relevant patterns (READ)
   - Process with smart matcher
   - Auto-apply high-confidence patterns
   - Generate optimized prompt
   - Call AI only for pending courses
   - Merge auto-applied + AI results
   - Record results to database (WRITE)
4. If no: Use traditional AI analysis

**Benefits:**
- Faster processing (auto-applied patterns skip AI)
- Cheaper (fewer AI API calls)
- More consistent (proven patterns applied uniformly)
- Continuously improving (learns from each analysis)

---

## User Interface

### 10. Frontend HTML

**File:** `local/enhanced.html`
**Purpose:** Main UI with learning integration
**Type:** Uses READ (display status) + WRITE (save results)

**Learning Features:**

**Status Badge (top-right corner):**
- Shows connection status
- Displays pattern count
- Updates automatically
- Click to open dashboard

**Dashboard Modal:**
- Keyboard: Ctrl+Shift+L
- Shows comprehensive statistics
- Real-time pattern data

**Initialization:**
```javascript
let learningClient = new LearningClient('http://localhost:3001');
window.learningClient = learningClient; // Make globally available
```

**User Actions:**
1. Upload transcript → Auto-gather patterns (READ)
2. Select program → Enhance analysis (READ)
3. Click "Analyze" → Auto-apply + AI analysis
4. Click "Save to Database" → Record results (WRITE)
5. Future analyses benefit from learned patterns

---

## Complete Data Flow

### WRITE Flow (Saving Patterns)

```
User Reviews Results
    ↓
Clicks "Save to Database"
    ↓
learning-client.js: recordAnalysisResults()
    ↓
HTTP POST to localhost:3001/api/learning/record
    ↓
learning-server.js: Receives request
    ↓
learning-engine.js: recordAnalysisResults()
    ↓
pattern-recorder.js: recordExemptionDecision() (for each result)
    ↓
connection.js: query() - Execute SQL INSERT/UPDATE
    ↓
PostgreSQL Database: exemption_patterns table updated
    ↓
pattern-recorder.js: calculateTimeWeightedConfidence()
    ↓
PostgreSQL Database: decision_history table updated
    ↓
Response sent back to browser
    ↓
User sees confirmation: "X patterns saved"
```

### READ Flow (Using Patterns)

```
User Uploads Transcript
    ↓
gemini-api.js: extractSubjects()
    ↓
learning-client.js: gatherLearningContext()
    ↓
HTTP POST to localhost:3001/api/learning/context
    ↓
learning-server.js: Receives request
    ↓
learning-engine.js: gatherLearningContext()
    ↓
pattern-retriever.js: getRelevantPatterns()
    ↓
connection.js: query() - Execute SQL SELECT
    ↓
PostgreSQL Database: exemption_patterns queried
    ↓
Patterns returned to browser
    ↓
smart-pattern-matcher.js: processWithPatterns()
    ↓
Auto-apply high-confidence (>90%)
Generate hints for medium-confidence (50-90%)
    ↓
gemini-api.js: generateOptimizedPrompt()
    ↓
AI analyzes only pending courses
    ↓
Results merged and displayed to user
```

---

## Configuration Files

**Environment Variables:** `.env.production.example`
```
LEARNING_ENABLED=true
LEARNING_SERVER_PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hkit_learning_db
DB_USER=hkit_admin
DB_PASSWORD=your_password
```

**Dependencies:** `package.json`
- `pg` - PostgreSQL client
- `express` - API server
- `cors` - Cross-origin requests
- `body-parser` - Request parsing

**Scripts:**
- `npm run server` - Start learning server
- `npm test` - Run tests

---

## Summary

### WRITE Operations (Saving to Database)
1. **pattern-recorder.js** - Core WRITE logic
2. **learning-engine.js** - Orchestrates WRITE
3. **learning-server.js** - API endpoint `/api/learning/record`
4. **learning-client.js** - Browser method `recordAnalysisResults()`

**User Action:** Click "Save to Database" button

---

### READ Operations (Reading from Database)
1. **pattern-retriever.js** - Core READ logic
2. **learning-engine.js** - Orchestrates READ
3. **learning-server.js** - API endpoints:
   - `/api/learning/context`
   - `/api/learning/enhance`
   - `/api/learning/dashboard`
   - `/api/learning/patterns`
4. **learning-client.js** - Browser methods for READ
5. **smart-pattern-matcher.js** - Uses READ data for auto-application

**User Action:** Automatic during analysis process

---

### Database Schema
- **schema.sql** - Table definitions
- **connection.js** - Connection pooling

---

### Integration Points
- **gemini-api.js** - AI integration with smart matching
- **enhanced.html** - UI with learning features

---

## Quick Reference

**Want to understand how patterns are saved?**
→ Look at: `pattern-recorder.js`

**Want to understand how patterns are retrieved?**
→ Look at: `pattern-retriever.js`

**Want to understand the API endpoints?**
→ Look at: `learning-server.js`

**Want to understand browser integration?**
→ Look at: `learning-client.js`

**Want to understand auto-application logic?**
→ Look at: `smart-pattern-matcher.js`

**Want to understand the database structure?**
→ Look at: `schema.sql`

**Want to understand the complete flow?**
→ Look at: `learning-engine.js`

---

*This mapping provides a complete picture of all database operations in the smart learning system.*
