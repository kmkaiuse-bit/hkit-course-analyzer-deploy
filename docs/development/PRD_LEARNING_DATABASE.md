# Product Requirements Document (PRD)
# Exemption Learning Database System
## HKIT Course Analyzer Enhancement

---

## 1. Executive Summary

### 1.1 Purpose
Implement a learning database system that captures exemption decision patterns to continuously improve AI accuracy in suggesting course exemptions for HKIT Advanced Standing applications.

### 1.2 Goals
- **Improve AI Accuracy**: Achieve 20%+ improvement in exemption suggestion accuracy
- **Capture Institutional Knowledge**: Build a database of proven exemption patterns
- **Maintain Simplicity**: Keep the system lean and performant
- **Preserve User Control**: Learning enhances but doesn't override user decisions

### 1.3 Success Metrics
- AI suggestion accuracy increases from ~70% to 85%+
- Reduction in user correction rate by 40%
- Database remains under 1MB even with 10,000+ patterns
- Query response time stays under 50ms

---

## 2. System Architecture

### 2.1 Database Design (HKIT-Centric)

#### 2.1.1 Database Technology: SQLite

**Recommendation: Use SQLite for solo-managed deployment**

Benefits for single-administrator projects:
- **Zero server management**: Single file database (`exemption_data.db`)
- **Easy backups**: Simple file copy for backup/restore
- **Portable**: Move file anywhere, works on any platform
- **No credentials**: No complex authentication setup
- **Full SQL power**: Complete SQL query support
- **Easy migration**: Can upgrade to MySQL/PostgreSQL later if needed
- **Built-in support**: Available in most frameworks by default

File structure:
```
📁 Project Root
├── 📄 exemption_data.db          # SQLite database file
├── 📁 backups/
│   ├── exemption_data_2025-01-15.db
│   └── exemption_data_2025-02-01.db
└── 📁 app/
```

#### 2.1.2 Database Schema

```sql
-- Table 1: Learning Patterns (for AI improvement)
CREATE TABLE exemption_patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Core relationship (HKIT course is primary)
  hkit_subject VARCHAR(20) NOT NULL,           -- e.g., "HD401"
  previous_subject VARCHAR(255) NOT NULL,      -- e.g., "Critical Thinking"
  previous_normalized VARCHAR(255) NOT NULL,   -- e.g., "critical_thinking"

  -- Learning metrics
  times_seen INTEGER DEFAULT 1,                -- Total occurrences
  times_exempted INTEGER DEFAULT 0,            -- Times exemption granted
  times_rejected INTEGER DEFAULT 0,            -- Times exemption denied
  confidence REAL DEFAULT 0.00,                -- Calculated confidence score (0.00-1.00)

  -- Metadata
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  programme_context VARCHAR(50),               -- Optional: programme code
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Constraint
  UNIQUE(hkit_subject, previous_normalized)
);

-- Indexes for exemption_patterns
CREATE INDEX idx_hkit ON exemption_patterns(hkit_subject);
CREATE INDEX idx_previous ON exemption_patterns(previous_normalized);
CREATE INDEX idx_confidence ON exemption_patterns(confidence);

-- Table 2: Analysis Results (for record-keeping and review)
CREATE TABLE analysis_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Session metadata
  analysis_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  programme_code VARCHAR(50) NOT NULL,
  programme_name VARCHAR(255),

  -- Optional tracking fields
  student_id VARCHAR(100),                     -- Optional: student reference
  application_reference VARCHAR(100),          -- Optional: application ID
  academic_year VARCHAR(20),                   -- e.g., "2024/2025"

  -- Analysis data (stored as JSON for flexibility)
  transcript_subjects TEXT,                    -- JSON: All subjects from transcript
  exemption_results TEXT,                      -- JSON: Complete exemption table

  -- Summary statistics
  total_subjects_analyzed INTEGER DEFAULT 0,
  total_exemptions_granted INTEGER DEFAULT 0,
  total_exemptions_rejected INTEGER DEFAULT 0,

  -- Status and quality tracking
  status VARCHAR(20) DEFAULT 'completed',      -- draft, completed, approved
  ai_assisted BOOLEAN DEFAULT 1,               -- Was AI used for analysis
  user_edited BOOLEAN DEFAULT 0,               -- Did user make manual changes
  notes TEXT,                                  -- Optional notes/comments

  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for analysis_results
CREATE INDEX idx_programme ON analysis_results(programme_code);
CREATE INDEX idx_date ON analysis_results(analysis_date);
CREATE INDEX idx_status ON analysis_results(status);
CREATE INDEX idx_student ON analysis_results(student_id);
CREATE INDEX idx_academic_year ON analysis_results(academic_year);

-- Table 3: Audit Log (optional, for tracking changes)
CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name VARCHAR(50) NOT NULL,
  record_id INTEGER NOT NULL,
  action VARCHAR(20) NOT NULL,                 -- insert, update, delete
  changed_data TEXT,                           -- JSON: What changed
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_table ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_timestamp ON audit_log(timestamp);
```

### 2.2 System Components

```
┌─────────────────────────────────────────────────────────┐
│                     User Interface                       │
├─────────────────────────────────────────────────────────┤
│  Stage 1: Extract     │    Stage 2: Analysis            │
│  • Upload transcript  │    • Select programme           │
│  • Extract subjects   │    • AI analysis (enhanced)     │
│  • Show dropdown      │    • Review & edit results      │
│  • (unchanged UI)     │    • Save (triggers learning)   │
└───────────┬───────────┴────────────┬────────────────────┘
            │                        │
            ↓                        ↓
┌─────────────────────────────────────────────────────────┐
│                  Learning Engine                         │
│  • Pattern matching                                      │
│  • Confidence calculation                                │
│  • Prompt enhancement                                    │
│  • Decision recording                                    │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────┐
│              Exemption Patterns Database                 │
│         (HKIT-centric single table design)              │
└─────────────────────────────────────────────────────────┘
```

---

## 3. User Flow & Data Recording

### 3.1 Stage 1: Transcript Upload & Subject Extraction

#### User Actions:
1. User uploads transcript (PDF/Excel/CSV)
2. System extracts subjects
3. User sees dropdown with ALL extracted subjects

#### System Process:
```javascript
async function processTranscriptUpload(file) {
  // Step 1: Extract subjects from transcript
  const extractedSubjects = await extractSubjectsFromFile(file);
  
  // Step 2: Background learning context gathering (invisible to user)
  const learningContext = await gatherLearningContext(extractedSubjects);
  
  // Step 3: Store context for Stage 2 (don't modify UI)
  sessionStorage.setItem('learningContext', JSON.stringify(learningContext));
  
  // Step 4: Return subjects for dropdown (unchanged)
  return {
    subjects: extractedSubjects,  // Complete list, no filtering
    metadata: {
      totalExtracted: extractedSubjects.length,
      timestamp: new Date().toISOString()
    }
  };
}

// Background learning context (no UI impact)
async function gatherLearningContext(subjects) {
  const context = {};
  
  for (const subject of subjects) {
    const patterns = await db.query(`
      SELECT hkit_subject, confidence, times_exempted, times_seen
      FROM exemption_patterns
      WHERE previous_normalized = ?
      AND confidence > 0.5
      ORDER BY confidence DESC
    `, [normalizeSubject(subject)]);
    
    if (patterns.length > 0) {
      context[subject] = {
        hasLearningData: true,
        topPatterns: patterns.slice(0, 5),
        averageConfidence: calculateAverage(patterns)
      };
    }
  }
  
  return context;
}
```

#### Data Recording: 
**NONE at this stage** - Read-only from database

#### UI Changes:
**NONE** - Dropdown remains exactly as current implementation

---

### 3.2 Stage 2: Programme Selection & AI Analysis

#### User Actions:
1. User selects target programme
2. User clicks "Analyze"
3. System shows results with exemption suggestions
4. User reviews and optionally edits
5. User clicks "Save"

#### System Process:

##### 3.2.1 Before AI Analysis
```javascript
async function prepareAnalysis(selectedSubjects, programme) {
  // Retrieve learning context from Stage 1
  const learningContext = JSON.parse(
    sessionStorage.getItem('learningContext') || '{}'
  );
  
  // Get HKIT courses for the selected programme
  const hkitCourses = await getHKITCourses(programme);
  
  // Find relevant patterns for enhancement
  const relevantPatterns = await findRelevantPatterns(
    hkitCourses,
    selectedSubjects
  );
  
  return {
    enhancedPrompt: buildEnhancedPrompt(
      selectedSubjects,
      programme,
      relevantPatterns
    ),
    patterns: relevantPatterns
  };
}

async function findRelevantPatterns(hkitCourses, selectedSubjects) {
  const patterns = {};
  
  // For each HKIT course, find qualifying subjects from our selection
  for (const hkitCourse of hkitCourses) {
    const qualifiers = await db.query(`
      SELECT previous_subject, previous_normalized, confidence,
             times_exempted, times_seen
      FROM exemption_patterns
      WHERE hkit_subject = ?
      AND confidence > 0.7
      ORDER BY confidence DESC
    `, [hkitCourse]);
    
    // Match against selected subjects
    const matches = qualifiers.filter(q =>
      selectedSubjects.some(s =>
        normalizeSubject(s) === q.previous_normalized
      )
    );
    
    if (matches.length > 0) {
      patterns[hkitCourse] = matches;
    }
  }
  
  return patterns;
}

function buildEnhancedPrompt(subjects, programme, patterns) {
  let prompt = ORIGINAL_ANALYSIS_PROMPT;
  
  // Add high-confidence patterns to prompt
  const highConfidencePatterns = Object.entries(patterns)
    .filter(([hkit, quals]) => 
      quals.some(q => q.confidence > 0.85)
    )
    .map(([hkit, quals]) => {
      const topQualifier = quals[0];
      return `- "${topQualifier.previous_subject}" typically exempts ${hkit} `+
             `(${Math.round(topQualifier.confidence * 100)}% confidence, ` +
             `${topQualifier.times_exempted}/${topQualifier.times_seen} success rate)`;
    });
  
  if (highConfidencePatterns.length > 0) {
    prompt += `\n\nHISTORICAL PATTERNS (use to improve accuracy):\n`;
    prompt += highConfidencePatterns.join('\n');
    prompt += `\n\nNote: These patterns are based on confirmed historical decisions. ` +
              `Use them to guide your analysis but still evaluate each case individually.`;
  }
  
  return prompt;
}
```

##### 3.2.2 After User Saves (DATA RECORDING HAPPENS HERE)
```javascript
async function saveAnalysisResults(results, userEdits, metadata) {
  // STEP 1: Save complete analysis results to database
  const analysisRecord = await saveAnalysisRecord({
    programmeCode: metadata.programmeCode,
    programmeName: metadata.programmeName,
    transcriptSubjects: metadata.originalSubjects,
    exemptionResults: results,
    totalAnalyzed: results.length,
    totalExempted: results.filter(r => r['Exemption Granted'] === 'Yes').length,
    totalRejected: results.filter(r => r['Exemption Granted'] === 'No').length,
    userEdited: userEdits && userEdits.size > 0,
    studentId: metadata.studentId || null,
    applicationRef: metadata.applicationRef || null,
    academicYear: metadata.academicYear || getCurrentAcademicYear(),
    notes: metadata.notes || null
  });

  // STEP 2: Record individual patterns for learning
  const recordingTasks = [];

  for (const row of results) {
    const hkitSubject = row['Exempted HKIT Subject Code'];
    const previousSubject = row['Subject Name of Previous Studies'];
    const exemptionGranted = row['Exemption Granted'] === 'Yes';
    const wasEdited = userEdits && userEdits.has(row.id);

    if (hkitSubject && previousSubject) {
      recordingTasks.push(
        recordExemptionPattern({
          hkit: hkitSubject,
          previous: previousSubject,
          exempted: exemptionGranted,
          wasUserEdit: wasEdited,
          programme: row['Programme'] || null,
          analysisId: analysisRecord.id  // Link to analysis record
        })
      );
    }
  }

  // Execute all recording tasks
  const recordingResults = await Promise.all(recordingTasks);

  // Show feedback to user
  const successCount = recordingResults.filter(r => r.success).length;
  showNotification(
    `✅ Saved! Analysis #${analysisRecord.id} recorded. ${successCount} patterns learned.`,
    'success'
  );

  return {
    saved: true,
    analysisId: analysisRecord.id,
    patternsLearned: successCount,
    timestamp: new Date().toISOString()
  };
}

// New function: Save complete analysis record
async function saveAnalysisRecord(data) {
  try {
    const result = await db.query(`
      INSERT INTO analysis_results (
        programme_code, programme_name,
        transcript_subjects, exemption_results,
        total_subjects_analyzed, total_exemptions_granted,
        total_exemptions_rejected, user_edited,
        student_id, application_reference, academic_year, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.programmeCode,
      data.programmeName,
      JSON.stringify(data.transcriptSubjects),
      JSON.stringify(data.exemptionResults),
      data.totalAnalyzed,
      data.totalExempted,
      data.totalRejected,
      data.userEdited ? 1 : 0,
      data.studentId,
      data.applicationRef,
      data.academicYear,
      data.notes
    ]);

    return {
      success: true,
      id: result.insertId || result.lastID  // Works for both MySQL and SQLite
    };

  } catch (error) {
    console.error('Failed to save analysis record:', error);
    throw error;
  }
}

async function recordExemptionPattern({hkit, previous, exempted, wasUserEdit, programme}) {
  const normalized = normalizeSubject(previous);
  
  try {
    // Check if pattern exists
    const existing = await db.query(`
      SELECT * FROM exemption_patterns
      WHERE hkit_subject = ? AND previous_normalized = ?
    `, [hkit, normalized]);
    
    if (existing.length > 0) {
      // Update existing pattern
      const current = existing[0];
      const newTimesSeen = current.times_seen + 1;
      const newTimesExempted = current.times_exempted + (exempted ? 1 : 0);
      const newTimesRejected = current.times_rejected + (exempted ? 0 : 1);
      const newConfidence = newTimesExempted / (newTimesExempted + newTimesRejected);
      
      await db.query(`
        UPDATE exemption_patterns
        SET times_seen = ?,
            times_exempted = ?,
            times_rejected = ?,
            confidence = ?,
            last_updated = NOW(),
            programme_context = COALESCE(programme_context, ?)
        WHERE id = ?
      `, [
        newTimesSeen,
        newTimesExempted,
        newTimesRejected,
        newConfidence,
        programme,
        current.id
      ]);
      
      // Log learning event
      logLearningEvent({
        action: 'pattern_updated',
        pattern: `${previous} → ${hkit}`,
        confidence: newConfidence,
        wasUserEdit: wasUserEdit
      });
      
    } else {
      // Create new pattern
      await db.query(`
        INSERT INTO exemption_patterns
        (hkit_subject, previous_subject, previous_normalized,
         times_seen, times_exempted, times_rejected, confidence,
         programme_context)
        VALUES (?, ?, ?, 1, ?, ?, ?, ?)
      `, [
        hkit,
        previous,
        normalized,
        exempted ? 1 : 0,
        exempted ? 0 : 1,
        exempted ? 1.0 : 0.0,
        programme
      ]);
      
      // Log learning event
      logLearningEvent({
        action: 'pattern_created',
        pattern: `${previous} → ${hkit}`,
        exempted: exempted,
        wasUserEdit: wasUserEdit
      });
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('Failed to record pattern:', error);
    return { success: false, error: error.message };
  }
}
```

---

## 4. Implementation Phases

### Phase 1: Database Setup (Week 1)
- [ ] Create exemption_patterns table
- [ ] Set up indexes and constraints
- [ ] Create database migration scripts
- [ ] Implement normalization function
- [ ] Create backup/restore procedures

### Phase 2: Data Access Layer (Week 1-2)
- [ ] Implement pattern recording functions
- [ ] Create pattern retrieval queries
- [ ] Build confidence calculation logic
- [ ] Add error handling and logging
- [ ] Create unit tests

### Phase 3: Learning Engine Integration (Week 2-3)
- [ ] Integrate with Stage 1 (read-only context gathering)
- [ ] Enhance AI prompt building with patterns
- [ ] Implement pattern matching logic
- [ ] Add session storage for cross-stage data
- [ ] Test with sample data

### Phase 4: UI Integration (Week 3-4)
- [ ] Add confidence indicators to results table
- [ ] Implement save trigger for learning
- [ ] Add learning feedback notifications
- [ ] Create analytics dashboard (optional)
- [ ] User acceptance testing

### Phase 5: Optimization & Monitoring (Week 4-5)
- [ ] Performance testing and optimization
- [ ] Add monitoring and analytics
- [ ] Implement data cleanup procedures
- [ ] Create admin tools for pattern management
- [ ] Documentation and training

---

## 5. Technical Specifications

### 5.1 Normalization Function
```javascript
function normalizeSubject(subject) {
  if (!subject) return '';
  
  return subject
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')           // Remove special characters
    .replace(/\s+/g, ' ')              // Normalize spaces
    .replace(/\b(skill|skills|course|subject|class)\b/gi, '') // Remove common suffixes
    .replace(/\b(i{1,3}|iv|v|vi{1,3})\b/gi, '')  // Remove roman numerals
    .replace(/\b\d+\b/g, '')           // Remove standalone numbers
    .replace(/\s+/g, '_')              // Convert spaces to underscores
    .replace(/^_|_$/g, '');            // Trim underscores
}

// Examples:
// "Critical Thinking Skills" → "critical_thinking"
// "Mathematics I" → "mathematics"
// "English (Advanced)" → "english_advanced"
```

### 5.2 Confidence Calculation
```javascript
function calculateConfidence(timesExempted, timesRejected) {
  const total = timesExempted + timesRejected;
  
  if (total === 0) return 0;
  
  // Simple ratio with minimum sample size consideration
  const rawConfidence = timesExempted / total;
  
  // Apply sample size penalty for low data
  if (total < 3) {
    return rawConfidence * 0.5;  // Low confidence for few samples
  } else if (total < 10) {
    return rawConfidence * 0.8;  // Moderate confidence
  }
  
  return rawConfidence;  // Full confidence for 10+ samples
}
```

### 5.3 API Endpoints

```javascript
// ========================================
// LEARNING PATTERNS API
// ========================================

// GET /api/patterns/check
// Check if patterns exist for given subjects
{
  subjects: ["Mathematics", "English"],
  programme: "BEng(CS)"  // optional
}

// POST /api/patterns/record
// Record exemption decisions (batch)
{
  patterns: [
    {
      hkit: "HD403",
      previous: "Mathematics",
      exempted: true,
      programme: "BEng(CS)"
    }
  ]
}

// GET /api/patterns/stats
// Get learning statistics
{
  totalPatterns: 1234,
  averageConfidence: 0.82,
  recentActivity: {...}
}

// ========================================
// ANALYSIS RESULTS API (NEW)
// ========================================

// POST /api/analysis/save
// Save complete analysis result
{
  programmeCode: "BEng(CS)",
  programmeName: "Bachelor of Engineering in Computer Science",
  transcriptSubjects: ["Mathematics", "English", ...],
  exemptionResults: [...],
  studentId: "S12345678",  // optional
  applicationRef: "APP-2025-001",  // optional
  academicYear: "2024/2025",
  notes: "Special consideration for..."  // optional
}

// GET /api/analysis/history?limit=20&offset=0
// Get recent analysis history
{
  results: [
    {
      id: 123,
      date: "2025-01-15T10:30:00Z",
      programme: "BEng(CS)",
      totalSubjects: 15,
      exemptionsGranted: 8,
      status: "completed"
    }
  ],
  total: 245,
  page: 1
}

// GET /api/analysis/:id
// Get specific analysis details
{
  id: 123,
  programmeCode: "BEng(CS)",
  programmeName: "Bachelor of Engineering in Computer Science",
  analysisDate: "2025-01-15T10:30:00Z",
  transcriptSubjects: [...],
  exemptionResults: [...],
  summary: {
    total: 15,
    exempted: 8,
    rejected: 7
  }
}

// GET /api/analysis/search?programme=BEng&year=2024
// Search analysis records
{
  filters: {
    programme: "BEng(CS)",
    academicYear: "2024/2025",
    dateFrom: "2024-09-01",
    dateTo: "2025-01-31",
    status: "completed"
  }
}

// DELETE /api/analysis/:id
// Delete analysis record (soft delete)
{
  id: 123,
  deleted: true
}

// GET /api/analysis/export/:id?format=json
// Export specific analysis (json, csv, excel)
// Returns downloadable file
```

---

## 6. User Interface Changes

### 6.1 Stage 1: NO CHANGES
- Dropdown remains unchanged
- Shows all extracted subjects
- No filtering based on learning data
- No visual indicators in dropdown

### 6.2 Stage 2: Minimal Enhancement
```javascript
// Results table - add subtle confidence indicators
┌──────────────────────────────────────────────────────────┐
│ Exempted HKIT │ Previous Subject │ Exempted │ Confidence │
├──────────────────────────────────────────────────────────┤
│ HD401         │ English          │ Yes ✓    │ ⭐ 88%     │
│ HD403         │ Mathematics      │ Yes ✓    │ ✅ 95%     │
│ HD405         │ Chinese          │ No ✗     │ 🆕 New     │
└──────────────────────────────────────────────────────────┘

// Confidence indicators:
✅ 90%+ : Very confident (green)
⭐ 70-89%: Good confidence (yellow)
⚠️ 50-69%: Mixed results (orange)
❌ <50%: Usually not exempted (red)
🆕 : New pattern (gray)
```

### 6.3 Notifications
```javascript
// After save
"✅ Saved! 5 patterns learned for future analysis."

// If high-confidence patterns helped
"💡 Used 3 high-confidence patterns to improve accuracy."

// First time seeing a pattern
"🆕 Learning new pattern: Psychology → HD406"
```

---

## 7. Data Privacy & Management

### 7.1 Data Retention
- Keep patterns for 12 months
- Archive patterns older than 12 months
- Delete patterns with <3 uses after 6 months

### 7.2 Privacy Considerations
- No personal student information stored
- Only subject-to-exemption mappings
- Programme context is optional
- No transcript content stored

### 7.3 SQLite Backup Strategy

**Automated Backup Implementation:**

```javascript
// Simple daily backup script
const fs = require('fs');
const path = require('path');

function backupDatabase() {
  const dbPath = './exemption_data.db';
  const backupDir = './backups';
  const date = new Date().toISOString().split('T')[0];
  const backupPath = path.join(backupDir, `exemption_data_${date}.db`);

  // Create backups directory if not exists
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Copy database file
  fs.copyFileSync(dbPath, backupPath);
  console.log(`✅ Backup created: ${backupPath}`);

  // Optional: Clean up old backups (keep last 30 days)
  cleanOldBackups(backupDir, 30);
}

function cleanOldBackups(backupDir, keepDays) {
  const files = fs.readdirSync(backupDir);
  const now = Date.now();
  const maxAge = keepDays * 24 * 60 * 60 * 1000;

  files.forEach(file => {
    const filePath = path.join(backupDir, file);
    const stats = fs.statSync(filePath);
    const age = now - stats.mtime.getTime();

    if (age > maxAge) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  Deleted old backup: ${file}`);
    }
  });
}

// Run backup daily (add to cron job or task scheduler)
// Linux/Mac cron: 0 2 * * * node backup-database.js
// Windows Task Scheduler: Run daily at 2:00 AM
backupDatabase();
```

**Manual Backup:**
```bash
# Simple file copy (Windows)
copy exemption_data.db backups\exemption_data_%date:~-4,4%%date:~-10,2%%date:~-7,2%.db

# Simple file copy (Linux/Mac)
cp exemption_data.db backups/exemption_data_$(date +%Y%m%d).db
```

**Restore from Backup:**
```bash
# Windows
copy backups\exemption_data_2025-01-15.db exemption_data.db

# Linux/Mac
cp backups/exemption_data_2025-01-15.db exemption_data.db
```

### 7.4 Data Export/Import

#### 7.4.1 Pattern Export (JSON)
```javascript
// Export learning patterns for sharing/migration
{
  "version": "1.0",
  "exported": "2025-09-11T10:30:00Z",
  "type": "learning_patterns",
  "patterns": [
    {
      "hkit": "HD401",
      "previous": "English",
      "normalized": "english",
      "confidence": 0.88,
      "samples": 45
    }
  ]
}
```

#### 7.4.2 Analysis Export (CSV)
```javascript
// Export analysis history as CSV
async function exportAnalysisToCSV(analysisId) {
  const analysis = await db.query(
    'SELECT * FROM analysis_results WHERE id = ?',
    [analysisId]
  );

  const results = JSON.parse(analysis.exemption_results);

  const csvHeader = 'HKIT Code,HKIT Name,Previous Subject,Grade,Exempted,Confidence\n';
  const csvRows = results.map(row =>
    `"${row.hkit_code}","${row.hkit_name}","${row.previous}","${row.grade}","${row.exempted}","${row.confidence}"`
  ).join('\n');

  return csvHeader + csvRows;
}
```

#### 7.4.3 Full Database Export (SQLite Dump)
```bash
# Export complete database to SQL file
sqlite3 exemption_data.db .dump > exemption_data_export.sql

# Import from SQL file
sqlite3 new_exemption_data.db < exemption_data_export.sql
```

---

## 8. Success Criteria

### 8.1 Quantitative Metrics
- [ ] AI accuracy improves by 20%+ within 500 analyses
- [ ] User correction rate decreases by 40%
- [ ] 80%+ of analyses benefit from learning patterns
- [ ] Query response time <50ms for pattern lookup
- [ ] Database size remains <1MB with 10,000 patterns

### 8.2 Qualitative Metrics
- [ ] Users report improved suggestion quality
- [ ] Reduced time spent on manual corrections
- [ ] Consistent exemption decisions across similar cases
- [ ] Positive feedback on system intelligence

### 8.3 Technical Requirements
- [ ] Zero impact on Stage 1 performance
- [ ] Backward compatible with existing data
- [ ] No UI breaking changes
- [ ] Graceful degradation if database unavailable

---

## 9. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Database grows too large | Performance degradation | Implement archiving and cleanup |
| Low-quality patterns | Reduced accuracy | Minimum confidence thresholds |
| Bias in learning data | Unfair exemptions | Regular pattern audits |
| Database unavailable | System fails | Graceful fallback to non-learning mode |
| Privacy concerns | Compliance issues | No PII stored, anonymized patterns |

---

## 10. Future Enhancements

### Phase 2 Features (Later)
1. **Pattern Similarity Detection**: Find similar subjects using NLP
2. **Conditional Exemptions**: Track conditions like "Grade B required"
3. **Multi-Programme Learning**: Share patterns across programmes
4. **Confidence Decay**: Reduce confidence for old unused patterns
5. **A/B Testing**: Compare learning vs non-learning accuracy

### Long-term Vision
1. **Institution-wide Sharing**: Export/import patterns between departments
2. **ML Model Training**: Use patterns to train custom ML models
3. **Automated Pattern Discovery**: Find new patterns automatically
4. **Student Success Tracking**: Correlate exemptions with student outcomes

---

## 11. Appendix

### A. Database Queries Reference

#### A.1 Learning Patterns Queries
```sql
-- Most common exemption patterns
SELECT hkit_subject, previous_subject, confidence, times_seen
FROM exemption_patterns
WHERE confidence > 0.8
ORDER BY times_seen DESC
LIMIT 100;

-- Patterns for specific HKIT course
SELECT previous_subject, confidence,
       (times_exempted || '/' || times_seen) as success_rate
FROM exemption_patterns
WHERE hkit_subject = 'HD401'
ORDER BY confidence DESC;

-- Recent learning activity (SQLite)
SELECT DATE(last_updated) as date, COUNT(*) as patterns_updated
FROM exemption_patterns
WHERE last_updated > datetime('now', '-7 days')
GROUP BY DATE(last_updated);

-- High confidence patterns by programme
SELECT programme_context, hkit_subject, previous_subject, confidence
FROM exemption_patterns
WHERE confidence > 0.85 AND programme_context IS NOT NULL
ORDER BY programme_context, confidence DESC;
```

#### A.2 Analysis Results Queries (NEW)
```sql
-- Recent analysis history
SELECT id, analysis_date, programme_code,
       total_subjects_analyzed, total_exemptions_granted,
       status, user_edited
FROM analysis_results
ORDER BY analysis_date DESC
LIMIT 20;

-- Analysis by programme (with statistics)
SELECT programme_code,
       COUNT(*) as total_analyses,
       AVG(total_exemptions_granted) as avg_exemptions,
       AVG(CAST(total_exemptions_granted AS REAL) / total_subjects_analyzed) as avg_exemption_rate
FROM analysis_results
WHERE status = 'completed'
GROUP BY programme_code
ORDER BY total_analyses DESC;

-- Find specific analysis by date range
SELECT id, programme_code, analysis_date,
       total_subjects_analyzed, total_exemptions_granted
FROM analysis_results
WHERE analysis_date >= '2025-01-01'
  AND analysis_date < '2025-02-01'
  AND programme_code = 'BEng(CS)'
ORDER BY analysis_date DESC;

-- Get complete analysis with details
SELECT id, analysis_date, programme_name,
       transcript_subjects, exemption_results,
       total_exemptions_granted, notes
FROM analysis_results
WHERE id = ?;

-- Monthly analysis volume
SELECT strftime('%Y-%m', analysis_date) as month,
       COUNT(*) as analyses_count,
       SUM(total_subjects_analyzed) as total_subjects,
       SUM(total_exemptions_granted) as total_exemptions
FROM analysis_results
GROUP BY strftime('%Y-%m', analysis_date)
ORDER BY month DESC;

-- User-edited analyses (quality check)
SELECT id, programme_code, analysis_date,
       total_subjects_analyzed, user_edited
FROM analysis_results
WHERE user_edited = 1
ORDER BY analysis_date DESC;

-- Search by student ID or application reference
SELECT id, analysis_date, programme_code,
       student_id, application_reference,
       total_exemptions_granted
FROM analysis_results
WHERE student_id = ? OR application_reference = ?;

-- Academic year summary
SELECT academic_year,
       programme_code,
       COUNT(*) as total_analyses,
       AVG(total_exemptions_granted) as avg_exemptions
FROM analysis_results
WHERE academic_year = '2024/2025'
GROUP BY academic_year, programme_code;
```

#### A.3 Combined Queries (Learning + Analysis)
```sql
-- How patterns improved over time
SELECT ep.hkit_subject, ep.previous_subject, ep.confidence,
       COUNT(ar.id) as times_used_in_analysis
FROM exemption_patterns ep
LEFT JOIN analysis_results ar ON
  json_extract(ar.exemption_results, '$') LIKE '%' || ep.hkit_subject || '%'
WHERE ep.confidence > 0.7
GROUP BY ep.hkit_subject, ep.previous_subject
ORDER BY times_used_in_analysis DESC;

-- Programme-specific pattern effectiveness
SELECT ar.programme_code,
       ep.hkit_subject,
       ep.confidence,
       COUNT(ar.id) as analyses_count
FROM exemption_patterns ep
JOIN analysis_results ar ON ar.programme_code = ep.programme_context
WHERE ep.confidence > 0.8
GROUP BY ar.programme_code, ep.hkit_subject
ORDER BY analyses_count DESC;
```

### B. Sample Learning Context
```json
{
  "Mathematics": {
    "hasLearningData": true,
    "topPatterns": [
      {"hkit": "HD403", "confidence": 0.95},
      {"hkit": "HD404", "confidence": 0.87}
    ],
    "averageConfidence": 0.91
  },
  "English": {
    "hasLearningData": true,
    "topPatterns": [
      {"hkit": "HD401", "confidence": 0.88}
    ],
    "averageConfidence": 0.88
  }
}
```

---

## Document Version
- **Version**: 2.0
- **Date**: 2025-11-03
- **Author**: HKIT Course Analyzer Team
- **Status**: Ready for Implementation
- **Changes in v2.0**:
  - Added SQLite database recommendation for solo-managed deployment
  - Added `analysis_results` table for storing complete analysis sessions
  - Added `audit_log` table for change tracking (optional)
  - Updated data persistence logic to save both patterns AND full analysis
  - Added comprehensive API endpoints for analysis history management
  - Added SQLite backup/restore procedures
  - Added database query examples for analysis results
  - Converted SQL syntax from MySQL to SQLite (INTEGER PRIMARY KEY AUTOINCREMENT, REAL, etc.)