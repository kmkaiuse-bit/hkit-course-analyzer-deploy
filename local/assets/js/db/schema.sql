-- HKIT Learning Database Schema
-- Exemption Patterns Learning System

-- Drop tables if exists (for fresh setup)
DROP TABLE IF EXISTS decision_history CASCADE;
DROP TABLE IF EXISTS exemption_patterns CASCADE;

-- Create exemption_patterns table
CREATE TABLE exemption_patterns (
  id SERIAL PRIMARY KEY,
  
  -- Core relationship (HKIT-centric)
  hkit_subject VARCHAR(20) NOT NULL,           -- e.g., "HD401"
  previous_subject VARCHAR(255) NOT NULL,      -- e.g., "Critical Thinking"
  previous_normalized VARCHAR(255) NOT NULL,   -- e.g., "critical_thinking"
  
  -- Learning metrics
  times_seen INTEGER DEFAULT 1,                -- Total occurrences
  times_exempted INTEGER DEFAULT 0,            -- Times exemption granted
  times_rejected INTEGER DEFAULT 0,            -- Times exemption denied
  confidence DECIMAL(3,2) DEFAULT 0.00,        -- Traditional confidence score (all-time average)
  weighted_confidence DECIMAL(5,4) DEFAULT 0.00,  -- Time-weighted confidence score
  confidence_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Last confidence calculation
  
  -- Metadata (using PostgreSQL JSONB for flexibility)
  metadata JSONB DEFAULT '{}',                 -- Additional context data
  programme_context VARCHAR(50),               -- Programme code context
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT unique_pattern UNIQUE(hkit_subject, previous_normalized),
  CONSTRAINT valid_confidence CHECK (confidence >= 0.00 AND confidence <= 1.00),
  CONSTRAINT valid_weighted_confidence CHECK (weighted_confidence >= 0.0000 AND weighted_confidence <= 1.0000),
  CONSTRAINT valid_counts CHECK (times_seen >= 0 AND times_exempted >= 0 AND times_rejected >= 0),
  CONSTRAINT consistent_counts CHECK (times_exempted + times_rejected <= times_seen)
);

-- Indexes for performance
CREATE INDEX idx_hkit ON exemption_patterns(hkit_subject);
CREATE INDEX idx_previous ON exemption_patterns(previous_normalized);
CREATE INDEX idx_confidence ON exemption_patterns(confidence DESC);
CREATE INDEX idx_weighted_confidence ON exemption_patterns(weighted_confidence DESC);
CREATE INDEX idx_metadata ON exemption_patterns USING GIN(metadata);
CREATE INDEX idx_programme ON exemption_patterns(programme_context);
CREATE INDEX idx_last_updated ON exemption_patterns(last_updated);
CREATE INDEX idx_confidence_updated_at ON exemption_patterns(confidence_updated_at);

-- Create decision_history table for granular tracking
CREATE TABLE decision_history (
  id SERIAL PRIMARY KEY,
  pattern_id INTEGER NOT NULL REFERENCES exemption_patterns(id) ON DELETE CASCADE,
  decision BOOLEAN NOT NULL,                    -- true = exempted, false = rejected
  decision_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  analysis_context JSONB DEFAULT '{}',         -- Context from analysis (programme, student info, etc.)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
);

-- Indexes for decision_history table
CREATE INDEX idx_decision_pattern_id ON decision_history(pattern_id);
CREATE INDEX idx_decision_date ON decision_history(decision_date DESC);
CREATE INDEX idx_decision ON decision_history(decision);
CREATE INDEX idx_decision_analysis_context ON decision_history USING GIN(analysis_context);

-- Trigger function for auto-updating last_updated
CREATE OR REPLACE FUNCTION update_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_exemption_patterns_timestamp
BEFORE UPDATE ON exemption_patterns
FOR EACH ROW
EXECUTE FUNCTION update_last_updated();

-- Insert sample data for testing (optional)
INSERT INTO exemption_patterns (hkit_subject, previous_subject, previous_normalized, times_seen, times_exempted, times_rejected, confidence, programme_context) VALUES
('HD401', 'Critical Thinking', 'critical_thinking', 10, 8, 2, 0.80, 'HD'),
('HD402', 'Communication Skills', 'communication_skills', 15, 12, 3, 0.80, 'HD'),
('IT101', 'Computer Fundamentals', 'computer_fundamentals', 20, 18, 2, 0.90, 'IT'),
('BM301', 'Business Management', 'business_management', 8, 6, 2, 0.75, 'BM'),
('AC201', 'Financial Accounting', 'financial_accounting', 12, 10, 2, 0.83, 'AC');

-- Create view for quick pattern analysis
CREATE OR REPLACE VIEW pattern_analysis AS
SELECT 
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
  ROUND((times_exempted::decimal / NULLIF(times_seen, 0)) * 100, 1) as exemption_rate,
  programme_context,
  last_updated,
  confidence_updated_at,
  EXTRACT(days FROM (CURRENT_TIMESTAMP - confidence_updated_at)) as days_since_update
FROM exemption_patterns
ORDER BY effective_confidence DESC, times_seen DESC;

-- Grant permissions (if using specific user)
-- GRANT ALL PRIVILEGES ON exemption_patterns TO hkit_admin;
-- GRANT ALL PRIVILEGES ON pattern_analysis TO hkit_admin;

-- Display sample data
SELECT * FROM pattern_analysis LIMIT 10;