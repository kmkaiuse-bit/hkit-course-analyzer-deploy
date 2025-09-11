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

```sql
-- Single table structure for lean implementation
CREATE TABLE exemption_patterns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Core relationship (HKIT course is primary)
  hkit_subject VARCHAR(20) NOT NULL,           -- e.g., "HD401"
  previous_subject VARCHAR(255) NOT NULL,      -- e.g., "Critical Thinking"
  previous_normalized VARCHAR(255) NOT NULL,   -- e.g., "critical_thinking"
  
  -- Learning metrics
  times_seen INT DEFAULT 1,                    -- Total occurrences
  times_exempted INT DEFAULT 0,                -- Times exemption granted
  times_rejected INT DEFAULT 0,                -- Times exemption denied
  confidence DECIMAL(3,2) DEFAULT 0.00,        -- Calculated confidence score
  
  -- Metadata
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  programme_context VARCHAR(50),               -- Optional: programme code
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  INDEX idx_hkit (hkit_subject),
  INDEX idx_previous (previous_normalized),
  INDEX idx_confidence (confidence),
  UNIQUE KEY unique_pattern (hkit_subject, previous_normalized)
);
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
async function saveAnalysisResults(results, userEdits) {
  // Record all exemption decisions for learning
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
          programme: row['Programme'] || null
        })
      );
    }
  }
  
  // Execute all recording tasks
  const recordingResults = await Promise.all(recordingTasks);
  
  // Show feedback to user
  const successCount = recordingResults.filter(r => r.success).length;
  showNotification(
    `✅ Saved! ${successCount} patterns learned for future analysis.`,
    'success'
  );
  
  return {
    saved: true,
    patternsLearned: successCount,
    timestamp: new Date().toISOString()
  };
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

### 5.3 API Endpoints (if needed)
```javascript
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

### 7.3 Data Export/Import
```javascript
// Export format (JSON)
{
  "version": "1.0",
  "exported": "2025-09-11T10:30:00Z",
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
```sql
-- Most common exemption patterns
SELECT hkit_subject, previous_subject, confidence, times_seen
FROM exemption_patterns
WHERE confidence > 0.8
ORDER BY times_seen DESC
LIMIT 100;

-- Patterns for specific HKIT course
SELECT previous_subject, confidence, 
       CONCAT(times_exempted, '/', times_seen) as success_rate
FROM exemption_patterns
WHERE hkit_subject = 'HD401'
ORDER BY confidence DESC;

-- Recent learning activity
SELECT DATE(last_updated) as date, COUNT(*) as patterns_updated
FROM exemption_patterns
WHERE last_updated > DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(last_updated);
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
- **Version**: 1.0
- **Date**: 2025-09-11
- **Author**: HKIT Course Analyzer Team
- **Status**: Ready for Implementation