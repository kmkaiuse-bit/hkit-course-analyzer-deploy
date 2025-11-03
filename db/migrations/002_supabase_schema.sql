-- ============================================================================
-- HKIT Learning Database Schema - Supabase (PostgreSQL) Version
-- Migration Script 002: Create Complete Schema for Supabase
-- ============================================================================
-- Date: 2025-11-03
-- Purpose: Complete database schema for Supabase cloud deployment
-- Database: PostgreSQL (Supabase)
-- ============================================================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS analysis_results CASCADE;
DROP TABLE IF EXISTS decision_history CASCADE;
DROP TABLE IF EXISTS exemption_patterns CASCADE;

-- ============================================================================
-- Table 1: Learning Patterns (for AI improvement)
-- ============================================================================
CREATE TABLE exemption_patterns (
  id SERIAL PRIMARY KEY,

  -- Core relationship (HKIT-centric)
  hkit_subject VARCHAR(20) NOT NULL,
  previous_subject VARCHAR(255) NOT NULL,
  previous_normalized VARCHAR(255) NOT NULL,

  -- Learning metrics
  times_seen INTEGER DEFAULT 1,
  times_exempted INTEGER DEFAULT 0,
  times_rejected INTEGER DEFAULT 0,
  confidence DECIMAL(5,4) DEFAULT 0.0000,
  weighted_confidence DECIMAL(5,4) DEFAULT 0.0000,
  confidence_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Metadata
  programme_context VARCHAR(50),
  exemption_rate DECIMAL(5,4),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT valid_confidence CHECK (confidence >= 0.0000 AND confidence <= 1.0000),
  CONSTRAINT valid_weighted_confidence CHECK (weighted_confidence >= 0.0000 AND weighted_confidence <= 1.0000),
  CONSTRAINT valid_counts CHECK (times_seen >= 0 AND times_exempted >= 0 AND times_rejected >= 0),
  CONSTRAINT consistent_counts CHECK (times_exempted + times_rejected <= times_seen),
  CONSTRAINT unique_pattern UNIQUE(hkit_subject, previous_normalized)
);

-- Indexes for exemption_patterns
CREATE INDEX idx_hkit ON exemption_patterns(hkit_subject);
CREATE INDEX idx_previous ON exemption_patterns(previous_normalized);
CREATE INDEX idx_confidence ON exemption_patterns(confidence DESC);
CREATE INDEX idx_weighted_confidence ON exemption_patterns(weighted_confidence DESC);
CREATE INDEX idx_programme ON exemption_patterns(programme_context);
CREATE INDEX idx_last_updated ON exemption_patterns(last_updated);

-- ============================================================================
-- Table 2: Decision History
-- ============================================================================
CREATE TABLE decision_history (
  id SERIAL PRIMARY KEY,
  pattern_id INTEGER NOT NULL,
  decision BOOLEAN NOT NULL,
  decision_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  analysis_context JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (pattern_id) REFERENCES exemption_patterns(id) ON DELETE CASCADE
);

-- Indexes for decision_history
CREATE INDEX idx_decision_pattern_id ON decision_history(pattern_id);
CREATE INDEX idx_decision_date ON decision_history(decision_date DESC);
CREATE INDEX idx_decision ON decision_history(decision);

-- ============================================================================
-- Table 3: Analysis Results (NEW - for complete session storage)
-- ============================================================================
CREATE TABLE analysis_results (
  id SERIAL PRIMARY KEY,

  -- Session metadata
  analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  programme_code VARCHAR(50) NOT NULL,
  programme_name VARCHAR(255),

  -- Optional tracking fields
  student_id VARCHAR(100),
  application_reference VARCHAR(100),
  academic_year VARCHAR(20),

  -- Analysis data (stored as JSON)
  transcript_subjects JSONB,
  exemption_results JSONB,

  -- Summary statistics
  total_subjects_analyzed INTEGER DEFAULT 0,
  total_exemptions_granted INTEGER DEFAULT 0,
  total_exemptions_rejected INTEGER DEFAULT 0,

  -- Status and quality tracking
  status VARCHAR(20) DEFAULT 'completed',
  ai_assisted BOOLEAN DEFAULT true,
  user_edited BOOLEAN DEFAULT false,
  notes TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for analysis_results
CREATE INDEX idx_ar_programme ON analysis_results(programme_code);
CREATE INDEX idx_ar_date ON analysis_results(analysis_date);
CREATE INDEX idx_ar_status ON analysis_results(status);
CREATE INDEX idx_ar_student ON analysis_results(student_id);
CREATE INDEX idx_ar_academic_year ON analysis_results(academic_year);
CREATE INDEX idx_ar_app_ref ON analysis_results(application_reference);

-- ============================================================================
-- Table 4: Audit Log
-- ============================================================================
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  table_name VARCHAR(50) NOT NULL,
  record_id INTEGER NOT NULL,
  action VARCHAR(20) NOT NULL,
  changed_data JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for audit_log
CREATE INDEX idx_audit_table ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_timestamp ON audit_log(timestamp);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Auto-update last_updated timestamp
CREATE OR REPLACE FUNCTION update_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_exemption_patterns_timestamp
BEFORE UPDATE ON exemption_patterns
FOR EACH ROW
EXECUTE FUNCTION update_last_updated();

-- Trigger: Auto-update updated_at for analysis_results
CREATE TRIGGER update_analysis_results_timestamp
BEFORE UPDATE ON analysis_results
FOR EACH ROW
EXECUTE FUNCTION update_last_updated();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Pattern Analysis Summary
CREATE OR REPLACE VIEW pattern_analysis AS
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
  ROUND((times_exempted::numeric / NULLIF(times_seen, 0)) * 100, 1) as exemption_rate_pct,
  programme_context,
  last_updated,
  confidence_updated_at,
  EXTRACT(DAY FROM (CURRENT_TIMESTAMP - confidence_updated_at)) as days_since_update,
  created_at
FROM exemption_patterns
ORDER BY effective_confidence DESC, times_seen DESC;

-- View: Recent Analysis Summary
CREATE OR REPLACE VIEW recent_analyses AS
SELECT
  id,
  analysis_date,
  programme_code,
  programme_name,
  total_subjects_analyzed,
  total_exemptions_granted,
  total_exemptions_rejected,
  ROUND((total_exemptions_granted::numeric / NULLIF(total_subjects_analyzed, 0)) * 100, 1) as exemption_rate_pct,
  status,
  user_edited,
  student_id,
  application_reference,
  academic_year,
  created_at
FROM analysis_results
ORDER BY analysis_date DESC;

-- View: Learning System Statistics
CREATE OR REPLACE VIEW learning_stats AS
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
  (SELECT COUNT(*) FROM analysis_results WHERE user_edited = true) as user_edited_analyses;

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

INSERT INTO exemption_patterns
  (hkit_subject, previous_subject, previous_normalized, times_seen, times_exempted, times_rejected, confidence, programme_context)
VALUES
  ('HD401', 'English Language', 'english_language', 10, 9, 1, 0.9000, 'HD'),
  ('HD402', 'Communication Skills', 'communication_skills', 15, 12, 3, 0.8000, 'HD'),
  ('HD403', 'Mathematics', 'mathematics', 20, 18, 2, 0.9000, 'HD'),
  ('IT101', 'Computer Fundamentals', 'computer_fundamentals', 18, 16, 2, 0.8889, 'IT'),
  ('BM301', 'Business Management', 'business_management', 8, 6, 2, 0.7500, 'BM')
ON CONFLICT (hkit_subject, previous_normalized) DO NOTHING;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (Optional - for Supabase security)
-- ============================================================================

-- Enable RLS on all tables (comment out if not needed)
ALTER TABLE exemption_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (adjust based on your needs)
CREATE POLICY "Enable all access for exemption_patterns" ON exemption_patterns FOR ALL USING (true);
CREATE POLICY "Enable all access for decision_history" ON decision_history FOR ALL USING (true);
CREATE POLICY "Enable all access for analysis_results" ON analysis_results FOR ALL USING (true);
CREATE POLICY "Enable all access for audit_log" ON audit_log FOR ALL USING (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show all tables
SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Show all views
SELECT schemaname, viewname FROM pg_views WHERE schemaname = 'public' ORDER BY viewname;

-- Show learning statistics
SELECT * FROM learning_stats;

-- ============================================================================
-- END OF MIGRATION SCRIPT
-- ============================================================================
