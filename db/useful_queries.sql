-- =====================================================
-- HKIT Course Analyzer - Useful SQL Queries
-- Supabase PostgreSQL Database
-- =====================================================
-- Use these queries in Supabase SQL Editor
-- https://supabase.com/dashboard → Your Project → SQL Editor
-- =====================================================

-- =====================================================
-- 1. VIEWING DATA
-- =====================================================

-- View all exemption patterns with confidence scores
SELECT
    id,
    previous_subject,
    hkit_subject_code,
    exempted,
    confidence_score,
    time_weighted_score,
    times_seen,
    programme_context,
    last_updated
FROM exemption_patterns
ORDER BY confidence_score DESC, times_seen DESC
LIMIT 50;

-- View recent analysis results
SELECT
    id,
    student_id,
    programme_code,
    total_subjects_analyzed,
    total_exemptions_granted,
    created_at,
    transcript_subjects,
    exemption_results
FROM analysis_results
ORDER BY created_at DESC
LIMIT 20;

-- View decision history
SELECT
    id,
    student_id,
    previous_subject,
    hkit_subject,
    decision,
    confidence_score,
    decision_timestamp
FROM decision_history
ORDER BY decision_timestamp DESC
LIMIT 50;

-- View audit log
SELECT
    id,
    table_name,
    operation,
    changed_by,
    changes,
    changed_at
FROM audit_log
ORDER BY changed_at DESC
LIMIT 50;

-- =====================================================
-- 2. STATISTICS & ANALYTICS
-- =====================================================

-- Count total patterns by exemption status
SELECT
    exempted,
    COUNT(*) as total_patterns,
    AVG(confidence_score) as avg_confidence,
    AVG(times_seen) as avg_times_seen
FROM exemption_patterns
GROUP BY exempted
ORDER BY exempted DESC;

-- Most frequently matched courses
SELECT
    hkit_subject_code,
    COUNT(*) as match_count,
    AVG(confidence_score) as avg_confidence,
    SUM(CASE WHEN exempted = TRUE THEN 1 ELSE 0 END) as exemption_count,
    SUM(CASE WHEN exempted = FALSE THEN 1 ELSE 0 END) as rejection_count
FROM exemption_patterns
GROUP BY hkit_subject_code
ORDER BY match_count DESC
LIMIT 20;

-- Programme-wise exemption statistics
SELECT
    programme_code,
    COUNT(*) as total_analyses,
    AVG(total_subjects_analyzed) as avg_subjects_per_student,
    AVG(total_exemptions_granted) as avg_exemptions_per_student,
    AVG(total_exemptions_granted::float / NULLIF(total_subjects_analyzed, 0) * 100) as avg_exemption_percentage
FROM analysis_results
GROUP BY programme_code
ORDER BY total_analyses DESC;

-- High confidence patterns (ready for auto-apply)
SELECT
    previous_subject,
    hkit_subject_code,
    exempted,
    confidence_score,
    time_weighted_score,
    times_seen,
    programme_context
FROM exemption_patterns
WHERE time_weighted_score >= 0.90
  AND times_seen >= 2
ORDER BY time_weighted_score DESC, times_seen DESC
LIMIT 30;

-- Low confidence patterns (need review)
SELECT
    previous_subject,
    hkit_subject_code,
    exempted,
    confidence_score,
    time_weighted_score,
    times_seen
FROM exemption_patterns
WHERE time_weighted_score < 0.50
ORDER BY times_seen DESC, confidence_score ASC
LIMIT 30;

-- Daily analysis activity
SELECT
    DATE(created_at) as analysis_date,
    COUNT(*) as analyses_count,
    SUM(total_subjects_analyzed) as total_subjects,
    SUM(total_exemptions_granted) as total_exemptions,
    AVG(total_exemptions_granted::float / NULLIF(total_subjects_analyzed, 0) * 100) as avg_exemption_rate
FROM analysis_results
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY analysis_date DESC;

-- =====================================================
-- 3. SEARCHING & FILTERING
-- =====================================================

-- Find patterns for specific previous course
SELECT
    previous_subject,
    hkit_subject_code,
    exempted,
    confidence_score,
    times_seen,
    programme_context
FROM exemption_patterns
WHERE LOWER(previous_subject) LIKE LOWER('%programming%')
ORDER BY confidence_score DESC;

-- Find patterns for specific HKIT course
SELECT
    previous_subject,
    hkit_subject_code,
    exempted,
    confidence_score,
    times_seen,
    programme_context
FROM exemption_patterns
WHERE hkit_subject_code = 'CMT4321'
ORDER BY confidence_score DESC;

-- Find analyses for specific student
SELECT
    id,
    student_id,
    programme_code,
    total_subjects_analyzed,
    total_exemptions_granted,
    created_at
FROM analysis_results
WHERE student_id = 'YOUR_STUDENT_ID'
ORDER BY created_at DESC;

-- Find analyses by programme
SELECT
    id,
    student_id,
    programme_code,
    total_subjects_analyzed,
    total_exemptions_granted,
    created_at
FROM analysis_results
WHERE programme_code = 'BENG_COMPUTING'
ORDER BY created_at DESC
LIMIT 20;

-- Find patterns updated in last 7 days
SELECT
    previous_subject,
    hkit_subject_code,
    exempted,
    confidence_score,
    times_seen,
    last_updated
FROM exemption_patterns
WHERE last_updated >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY last_updated DESC;

-- =====================================================
-- 4. DATA QUALITY CHECKS
-- =====================================================

-- Find duplicate patterns (same previous subject + HKIT course + programme)
SELECT
    previous_subject,
    hkit_subject_code,
    programme_context,
    COUNT(*) as duplicate_count
FROM exemption_patterns
GROUP BY previous_subject, hkit_subject_code, programme_context
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Find patterns with no previous subject (invalid data)
SELECT
    id,
    previous_subject,
    hkit_subject_code,
    exempted,
    confidence_score
FROM exemption_patterns
WHERE previous_subject IS NULL
   OR TRIM(previous_subject) = ''
ORDER BY id DESC;

-- Find patterns with very low times_seen but high confidence (suspicious)
SELECT
    previous_subject,
    hkit_subject_code,
    exempted,
    confidence_score,
    time_weighted_score,
    times_seen
FROM exemption_patterns
WHERE times_seen = 1
  AND confidence_score > 0.80
ORDER BY confidence_score DESC;

-- Check for analyses with >50% exemptions (should not happen)
SELECT
    id,
    student_id,
    programme_code,
    total_subjects_analyzed,
    total_exemptions_granted,
    (total_exemptions_granted::float / NULLIF(total_subjects_analyzed, 0) * 100) as exemption_percentage,
    created_at
FROM analysis_results
WHERE (total_exemptions_granted::float / NULLIF(total_subjects_analyzed, 0)) > 0.50
ORDER BY exemption_percentage DESC;

-- =====================================================
-- 5. UPDATING DATA
-- =====================================================

-- Update confidence score for specific pattern
UPDATE exemption_patterns
SET
    confidence_score = 0.95,
    time_weighted_score = 0.95,
    last_updated = NOW()
WHERE id = YOUR_PATTERN_ID;

-- Increment times_seen for pattern
UPDATE exemption_patterns
SET
    times_seen = times_seen + 1,
    last_updated = NOW()
WHERE id = YOUR_PATTERN_ID;

-- Update exemption decision for pattern
UPDATE exemption_patterns
SET
    exempted = TRUE,  -- or FALSE
    last_updated = NOW()
WHERE id = YOUR_PATTERN_ID;

-- Recalculate time_weighted_score (decay confidence over time)
UPDATE exemption_patterns
SET time_weighted_score = confidence_score * POWER(0.99,
    EXTRACT(DAY FROM NOW() - last_updated)
)
WHERE last_updated < CURRENT_DATE - INTERVAL '30 days';

-- Bulk update programme context
UPDATE exemption_patterns
SET
    programme_context = 'BENG_COMPUTING',
    last_updated = NOW()
WHERE programme_context IS NULL
  AND hkit_subject_code LIKE 'CMT%';

-- =====================================================
-- 6. DELETING DATA (USE WITH CAUTION)
-- =====================================================

-- Delete specific pattern by ID
DELETE FROM exemption_patterns
WHERE id = YOUR_PATTERN_ID;

-- Delete patterns with zero confidence
DELETE FROM exemption_patterns
WHERE confidence_score = 0 OR confidence_score IS NULL;

-- Delete old analysis results (older than 1 year)
DELETE FROM analysis_results
WHERE created_at < CURRENT_DATE - INTERVAL '365 days';

-- Delete patterns seen only once and low confidence (< 0.30)
DELETE FROM exemption_patterns
WHERE times_seen = 1
  AND confidence_score < 0.30;

-- Delete patterns with empty previous_subject
DELETE FROM exemption_patterns
WHERE previous_subject IS NULL
   OR TRIM(previous_subject) = '';

-- Clear all audit log entries older than 90 days
DELETE FROM audit_log
WHERE changed_at < CURRENT_DATE - INTERVAL '90 days';

-- =====================================================
-- 7. BACKUP & EXPORT
-- =====================================================

-- Export exemption patterns to CSV (copy results to spreadsheet)
COPY (
    SELECT
        id,
        previous_subject,
        hkit_subject_code,
        exempted,
        confidence_score,
        time_weighted_score,
        times_seen,
        programme_context,
        created_at,
        last_updated
    FROM exemption_patterns
    ORDER BY confidence_score DESC
) TO '/tmp/exemption_patterns_backup.csv' WITH CSV HEADER;

-- Export analysis results to CSV
COPY (
    SELECT
        id,
        student_id,
        programme_code,
        total_subjects_analyzed,
        total_exemptions_granted,
        created_at
    FROM analysis_results
    ORDER BY created_at DESC
) TO '/tmp/analysis_results_backup.csv' WITH CSV HEADER;

-- Note: COPY TO requires superuser permissions in PostgreSQL
-- For Supabase, use the SQL Editor results export feature instead:
-- 1. Run SELECT query
-- 2. Click "Download" button in results panel
-- 3. Choose CSV format

-- =====================================================
-- 8. MAINTENANCE QUERIES
-- =====================================================

-- Check database size
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Count records in all tables
SELECT
    'exemption_patterns' as table_name,
    COUNT(*) as record_count
FROM exemption_patterns
UNION ALL
SELECT
    'decision_history',
    COUNT(*)
FROM decision_history
UNION ALL
SELECT
    'analysis_results',
    COUNT(*)
FROM analysis_results
UNION ALL
SELECT
    'audit_log',
    COUNT(*)
FROM audit_log;

-- Find oldest and newest records
SELECT
    'exemption_patterns' as table_name,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record,
    COUNT(*) as total_records
FROM exemption_patterns
UNION ALL
SELECT
    'analysis_results',
    MIN(created_at),
    MAX(created_at),
    COUNT(*)
FROM analysis_results;

-- Vacuum analyze (optimize database performance)
-- Run this manually in SQL Editor occasionally
VACUUM ANALYZE exemption_patterns;
VACUUM ANALYZE decision_history;
VACUUM ANALYZE analysis_results;
VACUUM ANALYZE audit_log;

-- =====================================================
-- 9. ADVANCED ANALYTICS
-- =====================================================

-- Pattern effectiveness over time (trends)
SELECT
    DATE_TRUNC('week', last_updated) as week,
    COUNT(*) as patterns_updated,
    AVG(confidence_score) as avg_confidence,
    AVG(times_seen) as avg_usage
FROM exemption_patterns
WHERE last_updated >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE_TRUNC('week', last_updated)
ORDER BY week DESC;

-- Subject matching success rate
SELECT
    hkit_subject_code,
    COUNT(DISTINCT previous_subject) as unique_matches,
    AVG(confidence_score) as avg_confidence,
    SUM(times_seen) as total_uses,
    ROUND(SUM(CASE WHEN exempted = TRUE THEN times_seen ELSE 0 END)::numeric /
          NULLIF(SUM(times_seen), 0) * 100, 2) as exemption_rate_percent
FROM exemption_patterns
GROUP BY hkit_subject_code
HAVING COUNT(*) >= 3
ORDER BY total_uses DESC, avg_confidence DESC
LIMIT 30;

-- Student exemption patterns by programme
SELECT
    programme_code,
    COUNT(*) as student_count,
    MIN(total_exemptions_granted) as min_exemptions,
    MAX(total_exemptions_granted) as max_exemptions,
    AVG(total_exemptions_granted) as avg_exemptions,
    STDDEV(total_exemptions_granted) as stddev_exemptions
FROM analysis_results
GROUP BY programme_code
ORDER BY student_count DESC;

-- Time series: Analyses per month
SELECT
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as analyses_count,
    COUNT(DISTINCT student_id) as unique_students,
    AVG(total_exemptions_granted) as avg_exemptions
FROM analysis_results
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC
LIMIT 12;

-- Correlation between times_seen and confidence
SELECT
    CASE
        WHEN times_seen = 1 THEN '1 time'
        WHEN times_seen BETWEEN 2 AND 5 THEN '2-5 times'
        WHEN times_seen BETWEEN 6 AND 10 THEN '6-10 times'
        WHEN times_seen > 10 THEN '10+ times'
    END as usage_group,
    COUNT(*) as pattern_count,
    AVG(confidence_score) as avg_confidence,
    MIN(confidence_score) as min_confidence,
    MAX(confidence_score) as max_confidence
FROM exemption_patterns
GROUP BY
    CASE
        WHEN times_seen = 1 THEN '1 time'
        WHEN times_seen BETWEEN 2 AND 5 THEN '2-5 times'
        WHEN times_seen BETWEEN 6 AND 10 THEN '6-10 times'
        WHEN times_seen > 10 THEN '10+ times'
    END
ORDER BY MIN(times_seen);

-- =====================================================
-- 10. REPORTING QUERIES
-- =====================================================

-- Monthly summary report
SELECT
    TO_CHAR(created_at, 'YYYY-MM') as month,
    COUNT(*) as total_analyses,
    COUNT(DISTINCT student_id) as unique_students,
    COUNT(DISTINCT programme_code) as programmes_used,
    SUM(total_subjects_analyzed) as total_subjects_checked,
    SUM(total_exemptions_granted) as total_exemptions_granted,
    ROUND(AVG(total_exemptions_granted::float / NULLIF(total_subjects_analyzed, 0) * 100), 2) as avg_exemption_rate
FROM analysis_results
WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY TO_CHAR(created_at, 'YYYY-MM')
ORDER BY month DESC;

-- Top 10 most common previous courses leading to exemptions
SELECT
    previous_subject,
    COUNT(*) as exemption_count,
    AVG(confidence_score) as avg_confidence,
    STRING_AGG(DISTINCT hkit_subject_code, ', ') as matched_hkit_courses
FROM exemption_patterns
WHERE exempted = TRUE
GROUP BY previous_subject
ORDER BY exemption_count DESC
LIMIT 10;

-- Programme performance report
SELECT
    ar.programme_code,
    COUNT(ar.id) as total_analyses,
    AVG(ar.total_subjects_analyzed) as avg_subjects,
    AVG(ar.total_exemptions_granted) as avg_exemptions,
    ROUND(AVG(ar.total_exemptions_granted::float / NULLIF(ar.total_subjects_analyzed, 0) * 100), 2) as avg_exemption_rate,
    COUNT(DISTINCT ep.hkit_subject_code) as unique_courses_matched
FROM analysis_results ar
LEFT JOIN exemption_patterns ep ON ep.programme_context = ar.programme_code
GROUP BY ar.programme_code
ORDER BY total_analyses DESC;

-- Database health report
SELECT
    'Total Patterns' as metric,
    COUNT(*)::text as value
FROM exemption_patterns
UNION ALL
SELECT
    'High Confidence Patterns (>0.80)',
    COUNT(*)::text
FROM exemption_patterns
WHERE confidence_score > 0.80
UNION ALL
SELECT
    'Total Analyses',
    COUNT(*)::text
FROM analysis_results
UNION ALL
SELECT
    'Analyses This Month',
    COUNT(*)::text
FROM analysis_results
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
UNION ALL
SELECT
    'Average Exemption Rate',
    ROUND(AVG(total_exemptions_granted::float / NULLIF(total_subjects_analyzed, 0) * 100), 2)::text || '%'
FROM analysis_results
UNION ALL
SELECT
    'Most Active Programme',
    programme_code
FROM (
    SELECT programme_code, COUNT(*) as cnt
    FROM analysis_results
    GROUP BY programme_code
    ORDER BY cnt DESC
    LIMIT 1
) sub;

-- =====================================================
-- 11. USEFUL VIEWS (Create once, use repeatedly)
-- =====================================================

-- Create view for high-confidence patterns
CREATE OR REPLACE VIEW high_confidence_patterns AS
SELECT
    id,
    previous_subject,
    hkit_subject_code,
    exempted,
    confidence_score,
    time_weighted_score,
    times_seen,
    programme_context,
    last_updated
FROM exemption_patterns
WHERE time_weighted_score >= 0.80 AND times_seen >= 2
ORDER BY time_weighted_score DESC, times_seen DESC;

-- Create view for recent activity
CREATE OR REPLACE VIEW recent_activity AS
SELECT
    'Analysis' as activity_type,
    id,
    student_id as related_id,
    programme_code as details,
    created_at as activity_time
FROM analysis_results
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
UNION ALL
SELECT
    'Pattern Updated',
    id,
    hkit_subject_code,
    previous_subject,
    last_updated
FROM exemption_patterns
WHERE last_updated >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY activity_time DESC;

-- Create view for programme statistics
CREATE OR REPLACE VIEW programme_statistics AS
SELECT
    programme_code,
    COUNT(*) as total_analyses,
    COUNT(DISTINCT student_id) as unique_students,
    AVG(total_subjects_analyzed) as avg_subjects,
    AVG(total_exemptions_granted) as avg_exemptions,
    ROUND(AVG(total_exemptions_granted::float / NULLIF(total_subjects_analyzed, 0) * 100), 2) as avg_exemption_rate,
    MIN(created_at) as first_analysis,
    MAX(created_at) as last_analysis
FROM analysis_results
GROUP BY programme_code;

-- Use views like this:
-- SELECT * FROM high_confidence_patterns LIMIT 20;
-- SELECT * FROM recent_activity;
-- SELECT * FROM programme_statistics;

-- =====================================================
-- 12. TROUBLESHOOTING QUERIES
-- =====================================================

-- Find analyses without corresponding patterns
SELECT
    ar.id,
    ar.student_id,
    ar.programme_code,
    ar.total_subjects_analyzed,
    ar.total_exemptions_granted,
    ar.created_at
FROM analysis_results ar
LEFT JOIN exemption_patterns ep ON ep.programme_context = ar.programme_code
WHERE ep.id IS NULL
ORDER BY ar.created_at DESC
LIMIT 10;

-- Find patterns never used (times_seen = 0 or NULL)
SELECT
    id,
    previous_subject,
    hkit_subject_code,
    exempted,
    confidence_score,
    times_seen,
    created_at
FROM exemption_patterns
WHERE times_seen = 0 OR times_seen IS NULL
ORDER BY created_at DESC;

-- Check for data inconsistencies in analysis results
SELECT
    id,
    student_id,
    total_subjects_analyzed,
    total_exemptions_granted,
    (total_exemptions_granted::float / NULLIF(total_subjects_analyzed, 0) * 100) as calculated_percentage,
    created_at
FROM analysis_results
WHERE total_exemptions_granted > total_subjects_analyzed  -- Should never happen
   OR total_subjects_analyzed <= 0  -- Invalid
   OR total_exemptions_granted < 0  -- Invalid
ORDER BY created_at DESC;

-- =====================================================
-- END OF USEFUL QUERIES
-- =====================================================

-- Notes:
-- 1. Always test UPDATE/DELETE queries on a backup first
-- 2. Replace YOUR_PATTERN_ID, YOUR_STUDENT_ID with actual values
-- 3. For large datasets, add LIMIT to queries to avoid timeouts
-- 4. Use WHERE clauses carefully with DELETE operations
-- 5. Create backups before running maintenance queries
-- 6. Monitor query performance with EXPLAIN ANALYZE
-- 7. Schedule VACUUM ANALYZE monthly for optimal performance

-- For help with any query, contact: stevenkok@hkit.edu.hk
