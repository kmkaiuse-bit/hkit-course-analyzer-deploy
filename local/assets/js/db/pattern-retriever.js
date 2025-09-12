/**
 * Pattern Retrieval Module
 * Handles retrieving and formatting exemption patterns for AI prompt enhancement
 */

const dbConnection = require('./connection');
const PatternRecorder = require('./pattern-recorder');

class PatternRetriever {

    /**
     * Get relevant exemption patterns for a list of subjects
     */
    static async getRelevantPatterns(subjects, minConfidence = 0.3) {
        try {
            if (!subjects || subjects.length === 0) {
                return {};
            }

            const normalizedSubjects = subjects.map(subject => 
                PatternRecorder.normalizeSubject(subject)
            );

            // Query for patterns matching the subjects (use effective confidence for ordering)
            const result = await dbConnection.query(`
                SELECT 
                    hkit_subject,
                    previous_subject,
                    previous_normalized,
                    confidence,
                    weighted_confidence,
                    CASE 
                        WHEN weighted_confidence > 0 THEN weighted_confidence 
                        ELSE confidence 
                    END as effective_confidence,
                    times_seen,
                    times_exempted,
                    times_rejected,
                    programme_context,
                    last_updated,
                    confidence_updated_at,
                    EXTRACT(days FROM (CURRENT_TIMESTAMP - confidence_updated_at)) as days_since_update
                FROM exemption_patterns 
                WHERE previous_normalized = ANY($1) 
                AND CASE 
                    WHEN weighted_confidence > 0 THEN weighted_confidence 
                    ELSE confidence 
                END >= $2
                ORDER BY effective_confidence DESC, times_seen DESC
            `, [normalizedSubjects, minConfidence]);

            // Group patterns by original subject
            const patternsBySubject = {};
            
            for (const subject of subjects) {
                const normalized = PatternRecorder.normalizeSubject(subject);
                const matchingPatterns = result.rows.filter(
                    pattern => pattern.previous_normalized === normalized
                );
                
                if (matchingPatterns.length > 0) {
                    patternsBySubject[subject] = {
                        normalized: normalized,
                        patterns: matchingPatterns.map(pattern => ({
                            hkitSubject: pattern.hkit_subject,
                            confidence: parseFloat(pattern.confidence),
                            weightedConfidence: parseFloat(pattern.weighted_confidence || 0),
                            effectiveConfidence: parseFloat(pattern.effective_confidence),
                            exemptionRate: pattern.times_seen > 0 ? 
                                (pattern.times_exempted / pattern.times_seen) : 0,
                            sampleSize: pattern.times_seen,
                            programmeContext: pattern.programme_context,
                            lastSeen: pattern.last_updated,
                            confidenceUpdatedAt: pattern.confidence_updated_at,
                            daysSinceUpdate: parseInt(pattern.days_since_update || 0)
                        }))
                    };
                }
            }

            return patternsBySubject;

        } catch (error) {
            console.error('Error retrieving patterns:', error);
            return {};
        }
    }

    /**
     * Get top HKIT subjects that match with any of the given subjects
     */
    static async getTopMatchingHKITSubjects(subjects, limit = 10) {
        try {
            const normalizedSubjects = subjects.map(subject => 
                PatternRecorder.normalizeSubject(subject)
            );

            const result = await dbConnection.query(`
                SELECT 
                    hkit_subject,
                    COUNT(*) as match_count,
                    AVG(confidence) as avg_confidence,
                    SUM(times_exempted) as total_exemptions,
                    SUM(times_seen) as total_observations,
                    STRING_AGG(DISTINCT programme_context, ', ') as programmes
                FROM exemption_patterns 
                WHERE previous_normalized = ANY($1)
                GROUP BY hkit_subject
                ORDER BY avg_confidence DESC, total_observations DESC
                LIMIT $2
            `, [normalizedSubjects, limit]);

            return result.rows.map(row => ({
                hkitSubject: row.hkit_subject,
                matchCount: parseInt(row.match_count),
                avgConfidence: parseFloat(row.avg_confidence),
                totalExemptions: parseInt(row.total_exemptions),
                totalObservations: parseInt(row.total_observations),
                programmes: row.programmes
            }));

        } catch (error) {
            console.error('Error getting top matching HKIT subjects:', error);
            return [];
        }
    }

    /**
     * Generate learning context for AI prompt enhancement
     */
    static async generateLearningContext(subjects, programme = null) {
        try {
            const patterns = await this.getRelevantPatterns(subjects, 0.3);
            const topMatches = await this.getTopMatchingHKITSubjects(subjects, 5);

            if (Object.keys(patterns).length === 0 && topMatches.length === 0) {
                return {
                    hasLearningData: false,
                    message: 'No historical exemption patterns found for these subjects.'
                };
            }

            // Format learning context for AI prompt
            const contextSummary = {
                hasLearningData: true,
                totalSubjectsWithPatterns: Object.keys(patterns).length,
                totalPatterns: Object.values(patterns).reduce(
                    (sum, subjectData) => sum + subjectData.patterns.length, 0
                ),
                highConfidencePatterns: Object.values(patterns)
                    .flatMap(subjectData => subjectData.patterns)
                    .filter(pattern => pattern.confidence >= 0.7).length,
                patterns: patterns,
                topMatches: topMatches
            };

            // Generate human-readable summary
            const readableSummary = this.formatLearningContextForPrompt(
                contextSummary, 
                programme
            );

            return {
                ...contextSummary,
                promptEnhancement: readableSummary
            };

        } catch (error) {
            console.error('Error generating learning context:', error);
            return {
                hasLearningData: false,
                error: error.message
            };
        }
    }

    /**
     * Format learning context into human-readable text for AI prompt
     */
    static formatLearningContextForPrompt(contextSummary, programme = null) {
        if (!contextSummary.hasLearningData) {
            return '';
        }

        let enhancement = '\n\n=== HISTORICAL EXEMPTION PATTERNS ===\n';
        enhancement += `Based on ${contextSummary.totalPatterns} historical exemption decisions:\n\n`;

        // Add high-confidence patterns
        if (contextSummary.highConfidencePatterns > 0) {
            enhancement += `HIGH CONFIDENCE EXEMPTIONS (≥70% confidence):\n`;
            
            Object.entries(contextSummary.patterns).forEach(([subject, data]) => {
                const highConfPatterns = data.patterns.filter(p => p.confidence >= 0.7);
                if (highConfPatterns.length > 0) {
                    enhancement += `• "${subject}" commonly exempts:\n`;
                    highConfPatterns.forEach(pattern => {
                        const rate = Math.round(pattern.exemptionRate * 100);
                        enhancement += `  - ${pattern.hkitSubject} (${rate}% exemption rate)\n`;
                    });
                }
            });
            enhancement += '\n';
        }

        // Add moderate confidence patterns
        const moderatePatterns = Object.values(contextSummary.patterns)
            .flatMap(subjectData => subjectData.patterns)
            .filter(pattern => pattern.confidence >= 0.4 && pattern.confidence < 0.7);

        if (moderatePatterns.length > 0) {
            enhancement += `MODERATE CONFIDENCE PATTERNS (40-69% confidence):\n`;
            moderatePatterns.slice(0, 5).forEach(pattern => {
                const subject = Object.keys(contextSummary.patterns).find(key =>
                    contextSummary.patterns[key].patterns.includes(pattern)
                );
                const rate = Math.round(pattern.exemptionRate * 100);
                enhancement += `• "${subject}" → ${pattern.hkitSubject} (${rate}% exemption rate)\n`;
            });
            enhancement += '\n';
        }

        // Add programme context if available
        if (programme && contextSummary.topMatches.length > 0) {
            const programmeMatches = contextSummary.topMatches.filter(
                match => match.programmes && match.programmes.includes(programme)
            );
            if (programmeMatches.length > 0) {
                enhancement += `PROGRAMME-SPECIFIC PATTERNS for ${programme}:\n`;
                programmeMatches.slice(0, 3).forEach(match => {
                    enhancement += `• ${match.hkitSubject} (${match.totalExemptions}/${match.totalObservations} exemptions)\n`;
                });
                enhancement += '\n';
            }
        }

        enhancement += 'Please consider these patterns when making exemption suggestions, but prioritize the specific content match between subjects.\n';
        enhancement += '=== END HISTORICAL PATTERNS ===\n\n';

        return enhancement;
    }

    /**
     * Get learning statistics for dashboard with weighted confidence
     */
    static async getDashboardStats() {
        try {
            // Main statistics with both traditional and weighted confidence
            const result = await dbConnection.query(`
                SELECT 
                    COUNT(*) as total_patterns,
                    
                    -- Traditional confidence stats
                    COUNT(CASE WHEN confidence >= 0.8 THEN 1 END) as high_confidence,
                    COUNT(CASE WHEN confidence >= 0.5 AND confidence < 0.8 THEN 1 END) as medium_confidence,
                    COUNT(CASE WHEN confidence < 0.5 THEN 1 END) as low_confidence,
                    AVG(confidence) as avg_confidence,
                    
                    -- Weighted confidence stats
                    COUNT(CASE WHEN weighted_confidence >= 0.8 THEN 1 END) as weighted_high_confidence,
                    COUNT(CASE WHEN weighted_confidence >= 0.5 AND weighted_confidence < 0.8 THEN 1 END) as weighted_medium_confidence,
                    COUNT(CASE WHEN weighted_confidence > 0 AND weighted_confidence < 0.5 THEN 1 END) as weighted_low_confidence,
                    AVG(CASE WHEN weighted_confidence > 0 THEN weighted_confidence END) as avg_weighted_confidence,
                    COUNT(CASE WHEN weighted_confidence > 0 THEN 1 END) as patterns_with_weighted_confidence,
                    
                    -- Effective confidence (best of both)
                    AVG(CASE 
                        WHEN weighted_confidence > 0 THEN weighted_confidence 
                        ELSE confidence 
                    END) as avg_effective_confidence,
                    
                    -- General stats
                    SUM(times_seen) as total_observations,
                    COUNT(DISTINCT hkit_subject) as unique_hkit_subjects,
                    COUNT(DISTINCT programme_context) as unique_programmes,
                    MAX(last_updated) as last_update
                FROM exemption_patterns
            `);

            // Get decision history statistics
            const historyStats = await dbConnection.query(`
                SELECT 
                    COUNT(*) as total_decisions,
                    COUNT(CASE WHEN decision = true THEN 1 END) as total_exemptions,
                    COUNT(CASE WHEN decision = false THEN 1 END) as total_rejections,
                    MIN(decision_date) as earliest_decision,
                    MAX(decision_date) as latest_decision
                FROM decision_history
            `);

            // Get one-to-many relationship stats
            const relationshipStats = await dbConnection.query(`
                SELECT 
                    hkit_subject,
                    COUNT(*) as previous_subjects_count,
                    AVG(CASE WHEN weighted_confidence > 0 THEN weighted_confidence ELSE confidence END) as avg_subject_confidence,
                    STRING_AGG(previous_subject, ', ' ORDER BY 
                        CASE WHEN weighted_confidence > 0 THEN weighted_confidence ELSE confidence END DESC
                    ) as top_previous_subjects
                FROM exemption_patterns
                GROUP BY hkit_subject
                HAVING COUNT(*) > 1
                ORDER BY avg_subject_confidence DESC, previous_subjects_count DESC
                LIMIT 10
            `);

            const stats = result.rows[0];
            const history = historyStats.rows[0];
            
            return {
                // Traditional metrics
                totalPatterns: parseInt(stats.total_patterns),
                confidenceLevels: {
                    high: parseInt(stats.high_confidence),
                    medium: parseInt(stats.medium_confidence),
                    low: parseInt(stats.low_confidence)
                },
                avgConfidence: parseFloat(stats.avg_confidence || 0),
                
                // Weighted confidence metrics
                weightedConfidenceLevels: {
                    high: parseInt(stats.weighted_high_confidence),
                    medium: parseInt(stats.weighted_medium_confidence),
                    low: parseInt(stats.weighted_low_confidence)
                },
                avgWeightedConfidence: parseFloat(stats.avg_weighted_confidence || 0),
                patternsWithWeightedConfidence: parseInt(stats.patterns_with_weighted_confidence),
                avgEffectiveConfidence: parseFloat(stats.avg_effective_confidence || 0),
                
                // General stats
                totalObservations: parseInt(stats.total_observations),
                uniqueHKITSubjects: parseInt(stats.unique_hkit_subjects),
                uniqueProgrammes: parseInt(stats.unique_programmes),
                lastUpdate: stats.last_update,
                
                // Decision history stats
                totalDecisions: parseInt(history.total_decisions || 0),
                totalExemptions: parseInt(history.total_exemptions || 0),
                totalRejections: parseInt(history.total_rejections || 0),
                decisionDateRange: {
                    earliest: history.earliest_decision,
                    latest: history.latest_decision
                },
                
                // One-to-many relationship insights
                oneToManyRelationships: relationshipStats.rows.map(row => ({
                    hkitSubject: row.hkit_subject,
                    previousSubjectsCount: parseInt(row.previous_subjects_count),
                    avgConfidence: parseFloat(row.avg_subject_confidence),
                    topPreviousSubjects: row.top_previous_subjects
                }))
            };

        } catch (error) {
            console.error('Error getting dashboard stats:', error);
            return null;
        }
    }
}

module.exports = PatternRetriever;