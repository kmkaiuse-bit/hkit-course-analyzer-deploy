/**
 * Pattern Recording Module
 * Handles recording and updating exemption decision patterns for learning
 */

const dbConnection = require('./connection');

class PatternRecorder {
    
    /**
     * Normalize subject name for consistent matching
     */
    static normalizeSubject(subjectName) {
        return subjectName
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '') // Remove special characters
            .replace(/\s+/g, '_')        // Replace spaces with underscores
            .trim();
    }

    /**
     * Calculate confidence score with sample size penalty (traditional)
     */
    static calculateConfidence(exempted, rejected, sampleSizePenalty = 0.1) {
        const total = exempted + rejected;
        if (total === 0) return 0.00;
        
        const rawConfidence = exempted / total;
        
        // Apply sample size penalty (reduces confidence for small samples)
        const penalty = Math.exp(-total * sampleSizePenalty);
        const adjustedConfidence = rawConfidence * (1 - penalty);
        
        // Round to 2 decimal places and ensure within bounds
        return Math.min(1.00, Math.max(0.00, Math.round(adjustedConfidence * 100) / 100));
    }

    /**
     * Calculate time-weighted confidence score with 0.99 daily retention
     */
    static async calculateTimeWeightedConfidence(patternId, dailyRetention = 0.99) {
        try {
            // Get all decisions for this pattern
            const result = await dbConnection.query(`
                SELECT decision, decision_date 
                FROM decision_history 
                WHERE pattern_id = $1 
                ORDER BY decision_date DESC
            `, [patternId]);

            if (result.rows.length === 0) return 0.0000;

            let weightedSum = 0;
            let totalWeight = 0;
            const currentDate = new Date();

            for (const decision of result.rows) {
                const daysSince = this.getDaysSince(decision.decision_date, currentDate);
                const weight = Math.pow(dailyRetention, daysSince);
                
                // Apply the weight (true = exempted = 1, false = rejected = 0)
                weightedSum += (decision.decision ? 1 : 0) * weight;
                totalWeight += weight;
            }

            const weightedConfidence = totalWeight > 0 ? weightedSum / totalWeight : 0;
            
            // Round to 4 decimal places and ensure within bounds
            return Math.min(1.0000, Math.max(0.0000, Math.round(weightedConfidence * 10000) / 10000));

        } catch (error) {
            console.error('Error calculating time-weighted confidence:', error);
            return 0.0000;
        }
    }

    /**
     * Calculate days since a given date
     */
    static getDaysSince(pastDate, currentDate = new Date()) {
        const msPerDay = 24 * 60 * 60 * 1000;
        const timeDiff = currentDate.getTime() - new Date(pastDate).getTime();
        return Math.max(0, Math.floor(timeDiff / msPerDay));
    }

    /**
     * Record exemption decision for a subject pair with time-weighted confidence
     */
    static async recordExemptionDecision(hkitSubject, previousSubject, decision, programmeContext = null, analysisContext = {}) {
        try {
            const normalizedPrevious = this.normalizeSubject(previousSubject);
            const isExempted = decision === 'exempted' || decision === true;
            
            // Start transaction for atomic operation
            await dbConnection.query('BEGIN');
            
            try {
                // Check if pattern already exists
                const existingPattern = await dbConnection.query(
                    'SELECT * FROM exemption_patterns WHERE hkit_subject = $1 AND previous_normalized = $2',
                    [hkitSubject, normalizedPrevious]
                );

                let patternResult;
                let patternId;
                
                if (existingPattern.rows.length > 0) {
                    // Update existing pattern
                    const pattern = existingPattern.rows[0];
                    patternId = pattern.id;
                    const newTimesSeen = pattern.times_seen + 1;
                    const newTimesExempted = pattern.times_exempted + (isExempted ? 1 : 0);
                    const newTimesRejected = pattern.times_rejected + (isExempted ? 0 : 1);
                    const newConfidence = this.calculateConfidence(newTimesExempted, newTimesRejected);

                    patternResult = await dbConnection.query(`
                        UPDATE exemption_patterns 
                        SET times_seen = $1, 
                            times_exempted = $2, 
                            times_rejected = $3, 
                            confidence = $4,
                            programme_context = COALESCE($5, programme_context),
                            last_updated = CURRENT_TIMESTAMP
                        WHERE hkit_subject = $6 AND previous_normalized = $7
                        RETURNING *
                    `, [
                        newTimesSeen, 
                        newTimesExempted, 
                        newTimesRejected, 
                        newConfidence,
                        programmeContext,
                        hkitSubject, 
                        normalizedPrevious
                    ]);

                } else {
                    // Insert new pattern
                    const timesExempted = isExempted ? 1 : 0;
                    const timesRejected = isExempted ? 0 : 1;
                    const confidence = this.calculateConfidence(timesExempted, timesRejected);

                    patternResult = await dbConnection.query(`
                        INSERT INTO exemption_patterns 
                        (hkit_subject, previous_subject, previous_normalized, times_seen, times_exempted, times_rejected, confidence, programme_context)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        RETURNING *
                    `, [
                        hkitSubject, 
                        previousSubject, 
                        normalizedPrevious, 
                        1, 
                        timesExempted, 
                        timesRejected, 
                        confidence,
                        programmeContext
                    ]);
                    
                    patternId = patternResult.rows[0].id;
                }

                // Insert decision into history
                await dbConnection.query(`
                    INSERT INTO decision_history (pattern_id, decision, analysis_context)
                    VALUES ($1, $2, $3)
                `, [patternId, isExempted, JSON.stringify(analysisContext)]);

                // Calculate and update time-weighted confidence
                const weightedConfidence = await this.calculateTimeWeightedConfidence(patternId);
                
                await dbConnection.query(`
                    UPDATE exemption_patterns 
                    SET weighted_confidence = $1, confidence_updated_at = CURRENT_TIMESTAMP
                    WHERE id = $2
                `, [weightedConfidence, patternId]);

                // Commit transaction
                await dbConnection.query('COMMIT');

                console.log(`📊 Pattern recorded: ${hkitSubject} ← ${previousSubject} (${decision}) | Weighted: ${(weightedConfidence * 100).toFixed(2)}%`);
                return { ...patternResult.rows[0], weighted_confidence: weightedConfidence };

            } catch (innerError) {
                await dbConnection.query('ROLLBACK');
                throw innerError;
            }

        } catch (error) {
            console.error('Error recording exemption pattern:', error);
            throw error;
        }
    }

    /**
     * Record multiple exemption decisions from analysis results
     */
    static async recordAnalysisResults(analysisResults, programmeContext = null) {
        const recordedPatterns = [];
        
        try {
            // Extract exemption decisions from analysis results
            if (analysisResults.exemptions && Array.isArray(analysisResults.exemptions)) {
                for (const exemption of analysisResults.exemptions) {
                    if (exemption.hkitSubject && exemption.previousSubject && exemption.decision) {
                        const pattern = await this.recordExemptionDecision(
                            exemption.hkitSubject,
                            exemption.previousSubject,
                            exemption.decision,
                            programmeContext
                        );
                        recordedPatterns.push(pattern);
                    }
                }
            }

            console.log(`✅ Recorded ${recordedPatterns.length} exemption patterns`);
            return recordedPatterns;

        } catch (error) {
            console.error('Error recording analysis results:', error);
            throw error;
        }
    }

    /**
     * Recalculate weighted confidence for all patterns with decision history
     */
    static async recalculateAllWeightedConfidence(dailyRetention = 0.99) {
        try {
            console.log('🔄 Recalculating time-weighted confidence for all patterns...');
            
            // Get all patterns that should have weighted confidence
            const patterns = await dbConnection.query(`
                SELECT id, hkit_subject, previous_subject 
                FROM exemption_patterns 
                WHERE id IN (SELECT DISTINCT pattern_id FROM decision_history)
            `);

            let updatedCount = 0;
            
            for (const pattern of patterns.rows) {
                const weightedConfidence = await this.calculateTimeWeightedConfidence(pattern.id, dailyRetention);
                
                await dbConnection.query(`
                    UPDATE exemption_patterns 
                    SET weighted_confidence = $1, confidence_updated_at = CURRENT_TIMESTAMP
                    WHERE id = $2
                `, [weightedConfidence, pattern.id]);
                
                updatedCount++;
                console.log(`  ✓ ${pattern.hkit_subject} ← ${pattern.previous_subject}: ${(weightedConfidence * 100).toFixed(2)}%`);
            }

            console.log(`✅ Updated weighted confidence for ${updatedCount} patterns`);
            return updatedCount;

        } catch (error) {
            console.error('Error recalculating weighted confidence scores:', error);
            throw error;
        }
    }

    /**
     * Bulk update confidence scores for all patterns
     */
    static async recalculateAllConfidenceScores() {
        try {
            const result = await dbConnection.query(`
                UPDATE exemption_patterns 
                SET confidence = CASE 
                    WHEN (times_exempted + times_rejected) = 0 THEN 0.00
                    ELSE LEAST(1.00, GREATEST(0.00, 
                        ROUND((times_exempted::decimal / (times_exempted + times_rejected)) * 
                        (1 - EXP(-(times_exempted + times_rejected) * 0.1)) * 100) / 100
                    ))
                END,
                last_updated = CURRENT_TIMESTAMP
                WHERE (times_exempted + times_rejected) > 0
                RETURNING id, hkit_subject, confidence
            `);

            console.log(`🔄 Recalculated confidence for ${result.rows.length} patterns`);
            return result.rows;

        } catch (error) {
            console.error('Error recalculating confidence scores:', error);
            throw error;
        }
    }

    /**
     * Get learning statistics
     */
    static async getLearningStats() {
        try {
            const stats = await dbConnection.query(`
                SELECT 
                    COUNT(*) as total_patterns,
                    COUNT(CASE WHEN confidence >= 0.8 THEN 1 END) as high_confidence_patterns,
                    COUNT(CASE WHEN confidence >= 0.5 THEN 1 END) as medium_confidence_patterns,
                    AVG(confidence) as avg_confidence,
                    SUM(times_seen) as total_observations,
                    MAX(last_updated) as last_learning_update
                FROM exemption_patterns
            `);

            return stats.rows[0];

        } catch (error) {
            console.error('Error getting learning stats:', error);
            throw error;
        }
    }
}

module.exports = PatternRecorder;