-- ============================================================================
-- HKIT Learning Database Schema - SQLite Version
-- Migration Script 001: Create Complete Schema
-- ============================================================================
-- Date: 2025-11-03
-- Purpose: Complete database schema for exemption learning and analysis storage
-- Database: SQLite 3
-- ============================================================================

-- Table 1: Learning Patterns (for AI improvement)
-- Stores subject-to-exemption mappings with confidence scores
CREATE TABLE IF NOT EXISTS exemption_patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Core relationship (HKIT-centric)
  hkit_subject VARCHAR(20) NOT NULL,           -- e.g., "HD401"
  previous_subject VARCHAR(255) NOT NULL,      -- e.g., "Critical Thinking"
  previous_normalized VARCHAR(255) NOT NULL,   -- e.g., "critical_thinking"

  -- Learning metrics
  times_seen INTEGER DEFAULT 1,                -- Total occurrences
  times_exempted INTEGER DEFAULT 0,            -- Times exemption granted
  times_rejected INTEGER DEFAULT 0,            -- Times exemption denied
  confidence REAL DEFAULT 0.00,                -- Calculated confidence score (0.00-1.00)
  weighted_confidence REAL DEFAULT 0.00,       -- Time-weighted confidence score
  confidence_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Metadata
  programme_context VARCHAR(50),               -- Optional: programme code
  exemption_rate REAL,                         -- Percentage: times_exempted / times_seen
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT valid_confidence CHECK (confidence >= 0.00 AND confidence <= 1.00),
  CONSTRAINT valid_weighted_confidence CHECK (weighted_confidence >= 0.00 AND weighted_confidence <= 1.00),
  CONSTRAINT valid_counts CHECK (times_seen >= 0 AND times_exempted >= 0 AND times_rejected >= 0),
  CONSTRAINT consistent_counts CHECK (times_exempted + times_rejected <= times_seen),
  CONSTRAINT unique_pattern UNIQUE(hkit_subject, previous_normalized)
);

-- Indexes for exemption_patterns
CREATE INDEX IF NOT EXISTS idx_hkit ON exemption_patterns(hkit_subject);
CREATE INDEX IF NOT EXISTS idx_previous ON exemption_patterns(previous_normalized);
CREATE INDEX IF NOT EXISTS idx_confidence ON exemption_patterns(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_weighted_confidence ON exemption_patterns(weighted_confidence DESC);
CREATE INDEX IF NOT EXISTS idx_programme ON exemption_patterns(programme_context);
CREATE INDEX IF NOT EXISTS idx_last_updated ON exemption_patterns(last_updated);

-- ============================================================================

-- Table 2: Decision History (for time-weighted confidence calculation)
-- Tracks individual exemption decisions over time
CREATE TABLE IF NOT EXISTS decision_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pattern_id INTEGER NOT NULL,
  decision BOOLEAN NOT NULL,                    -- 1 = exempted, 0 = rejected
  decision_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  analysis_context TEXT,                        -- JSON: Context from analysis
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (pattern_id) REFERENCES exemption_patterns(id) ON DELETE CASCADE
);

-- Indexes for decision_history
CREATE INDEX IF NOT EXISTS idx_decision_pattern_id ON decision_history(pattern_id);
CREATE INDEX IF NOT EXISTS idx_decision_date ON decision_history(decision_date DESC);
CREATE INDEX IF NOT EXISTS idx_decision ON decision_history(decision);

-- ============================================================================

-- Table 3: Analysis Results (for record-keeping and review)
-- Stores complete analysis sessions for future reference
CREATE TABLE IF NOT EXISTS analysis_results (
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
CREATE INDEX IF NOT EXISTS idx_ar_programme ON analysis_results(programme_code);
CREATE INDEX IF NOT EXISTS idx_ar_date ON analysis_results(analysis_date);
CREATE INDEX IF NOT EXISTS idx_ar_status ON analysis_results(status);
CREATE INDEX IF NOT EXISTS idx_ar_student ON analysis_results(student_id);
CREATE INDEX IF NOT EXISTS idx_ar_academic_year ON analysis_results(academic_year);
CREATE INDEX IF NOT EXISTS idx_ar_app_ref ON analysis_results(application_reference);

-- ============================================================================

-- Table 4: Audit Log (optional, for tracking changes)
-- Tracks all changes to critical tables
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name VARCHAR(50) NOT NULL,
  record_id INTEGER NOT NULL,
  action VARCHAR(20) NOT NULL,                 -- insert, update, delete
  changed_data TEXT,                           -- JSON: What changed
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for audit_log
CREATE INDEX IF NOT EXISTS idx_audit_table ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Auto-update last_updated timestamp on exemption_patterns
CREATE TRIGGER IF NOT EXISTS update_exemption_patterns_timestamp
AFTER UPDATE ON exemption_patterns
FOR EACH ROW
BEGIN
  UPDATE exemption_patterns
  SET last_updated = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;

-- Trigger: Auto-update updated_at timestamp on analysis_results
CREATE TRIGGER IF NOT EXISTS update_analysis_results_timestamp
AFTER UPDATE ON analysis_results
FOR EACH ROW
BEGIN
  UPDATE analysis_results
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;

-- Trigger: Calculate exemption_rate automatically
CREATE TRIGGER IF NOT EXISTS calculate_exemption_rate
AFTER UPDATE OF times_exempted, times_seen ON exemption_patterns
FOR EACH ROW
WHEN NEW.times_seen > 0
BEGIN
  UPDATE exemption_patterns
  SET exemption_rate = CAST(NEW.times_exempted AS REAL) / NEW.times_seen
  WHERE id = NEW.id;
END;

-- Trigger: Audit trail for exemption_patterns updates
CREATE TRIGGER IF NOT EXISTS audit_exemption_patterns_update
AFTER UPDATE ON exemption_patterns
FOR EACH ROW
BEGIN
  INSERT INTO audit_log (table_name, record_id, action, changed_data)
  VALUES (
    'exemption_patterns',
    NEW.id,
    'update',
    json_object(
      'old_confidence', OLD.confidence,
      'new_confidence', NEW.confidence,
      'old_times_seen', OLD.times_seen,
      'new_times_seen', NEW.times_seen
    )
  );
END;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Pattern Analysis Summary
CREATE VIEW IF NOT EXISTS pattern_analysis AS
SELECT
  id,
  hkit_subject,
  previous_subject,
  times_seen,
  times_exempted,
  times_rejected,
  confidence,
  weighted_confidence,
  CASE
    WHEN weighted_confidence > 0 THEN weighted_confidence
    ELSE confidence
  END as effective_confidence,
  ROUND((CAST(times_exempted AS REAL) / NULLIF(times_seen, 0)) * 100, 1) as exemption_rate_pct,
  programme_context,
  last_updated,
  confidence_updated_at,
  CAST((julianday('now') - julianday(confidence_updated_at)) AS INTEGER) as days_since_update,
  created_at
FROM exemption_patterns
ORDER BY effective_confidence DESC, times_seen DESC;

-- View: Recent Analysis Summary
CREATE VIEW IF NOT EXISTS recent_analyses AS
SELECT
  id,
  analysis_date,
  programme_code,
  programme_name,
  total_subjects_analyzed,
  total_exemptions_granted,
  total_exemptions_rejected,
  ROUND((CAST(total_exemptions_granted AS REAL) / NULLIF(total_subjects_analyzed, 0)) * 100, 1) as exemption_rate_pct,
  status,
  user_edited,
  student_id,
  application_reference,
  academic_year,
  created_at
FROM analysis_results
ORDER BY analysis_date DESC;

-- View: Learning System Statistics
CREATE VIEW IF NOT EXISTS learning_stats AS
SELECT
  (SELECT COUNT(*) FROM exemption_patterns) as total_patterns,
  (SELECT COUNT(*) FROM analysis_results) as total_analyses,
  (SELECT ROUND(AVG(confidence), 3) FROM exemption_patterns) as avg_confidence,
  (SELECT ROUND(AVG(weighted_confidence), 3) FROM exemption_patterns WHERE weighted_confidence > 0) as avg_weighted_confidence,
  (SELECT SUM(times_seen) FROM exemption_patterns) as total_observations,
  (SELECT SUM(times_exempted) FROM exemption_patterns) as total_exemptions,
  (SELECT COUNT(DISTINCT hkit_subject) FROM exemption_patterns) as unique_hkit_subjects,
  (SELECT COUNT(DISTINCT programme_context) FROM exemption_patterns WHERE programme_context IS NOT NULL) as unique_programmes,
  (SELECT COUNT(*) FROM exemption_patterns WHERE confidence > 0.85) as high_confidence_patterns,
  (SELECT COUNT(*) FROM analysis_results WHERE user_edited = 1) as user_edited_analyses;

-- ============================================================================
-- SAMPLE DATA (for testing - comment out for production)
-- ============================================================================

INSERT OR IGNORE INTO exemption_patterns
  (hkit_subject, previous_subject, previous_normalized, times_seen, times_exempted, times_rejected, confidence, programme_context)
VALUES
  ('HD401', 'English Language', 'english_language', 10, 9, 1, 0.90, 'HD'),
  ('HD402', 'Communication Skills', 'communication_skills', 15, 12, 3, 0.80, 'HD'),
  ('HD403', 'Mathematics', 'mathematics', 20, 18, 2, 0.90, 'HD'),
  ('IT101', 'Computer Fundamentals', 'computer_fundamentals', 18, 16, 2, 0.89, 'IT'),
  ('BM301', 'Business Management', 'business_management', 8, 6, 2, 0.75, 'BM');

-- ============================================================================
-- SCHEMA VERIFICATION QUERIES
-- ============================================================================

-- Verify tables created
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;

-- Verify indexes created
SELECT name FROM sqlite_master WHERE type='index' ORDER BY name;

-- Verify triggers created
SELECT name FROM sqlite_master WHERE type='trigger' ORDER BY name;

-- Verify views created
SELECT name FROM sqlite_master WHERE type='view' ORDER BY name;

-- Display learning statistics
SELECT * FROM learning_stats;

-- ============================================================================
-- END OF MIGRATION SCRIPT
-- ============================================================================
