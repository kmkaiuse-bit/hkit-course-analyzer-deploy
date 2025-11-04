/**
 * Supabase Cloud Database Client
 * Handles connection and operations with Supabase PostgreSQL database
 */

const SupabaseClient = {
    client: null,
    isConnected: false,
    config: {
        // These will be set from environment variables or config
        supabaseUrl: null,
        supabaseKey: null
    },

    /**
     * Initialize Supabase client
     * Call this on page load with your Supabase credentials
     */
    async init(supabaseUrl, supabaseKey) {
        try {
            if (!supabaseUrl || !supabaseKey) {
                console.warn('⚠️ Supabase credentials not provided - running in offline mode');
                return false;
            }

            this.config.supabaseUrl = supabaseUrl;
            this.config.supabaseKey = supabaseKey;

            // Initialize Supabase client
            this.client = supabase.createClient(supabaseUrl, supabaseKey);

            // Test connection
            const { data, error } = await this.client
                .from('exemption_patterns')
                .select('count')
                .limit(1);

            if (error) {
                console.error('❌ Supabase connection test failed:', error);
                this.isConnected = false;
                return false;
            }

            this.isConnected = true;
            console.log('✅ Supabase client initialized successfully');
            return true;

        } catch (error) {
            console.error('❌ Supabase initialization error:', error);
            this.isConnected = false;
            return false;
        }
    },

    /**
     * Record exemption pattern to Supabase
     */
    async recordExemptionPattern(pattern) {
        if (!this.isConnected) {
            console.warn('Supabase not connected - skipping cloud save');
            return { success: false, error: 'Not connected' };
        }

        try {
            const normalized = this.normalizeSubject(pattern.previousSubject);

            // Check if pattern exists
            const { data: existing, error: fetchError } = await this.client
                .from('exemption_patterns')
                .select('*')
                .eq('hkit_subject', pattern.hkitSubject)
                .eq('previous_normalized', normalized)
                .single();

            if (existing) {
                // Update existing pattern
                const newTimesSeen = existing.times_seen + 1;
                const newTimesExempted = existing.times_exempted + (pattern.exempted ? 1 : 0);
                const newTimesRejected = existing.times_rejected + (pattern.exempted ? 0 : 1);
                const newConfidence = newTimesExempted / (newTimesExempted + newTimesRejected);
                const newExemptionRate = newTimesExempted / newTimesSeen;  // ✅ Calculate exemption rate

                const { error: updateError } = await this.client
                    .from('exemption_patterns')
                    .update({
                        times_seen: newTimesSeen,
                        times_exempted: newTimesExempted,
                        times_rejected: newTimesRejected,
                        confidence: newConfidence.toFixed(4),
                        exemption_rate: newExemptionRate.toFixed(4),  // ✅ Update exemption_rate
                        programme_context: pattern.programme || existing.programme_context || null,  // ✅ Update programme_context
                        last_updated: new Date().toISOString()
                    })
                    .eq('id', existing.id);

                if (updateError) throw updateError;

                return { success: true, action: 'updated', id: existing.id };

            } else {
                // Insert new pattern
                const confidence = pattern.exempted ? 1.0 : 0.0;
                const exemptionRate = pattern.exempted ? 1.0 : 0.0;  // ✅ For first record, same as confidence

                const { data: inserted, error: insertError } = await this.client
                    .from('exemption_patterns')
                    .insert({
                        hkit_subject: pattern.hkitSubject,
                        previous_subject: pattern.previousSubject,
                        previous_normalized: normalized,
                        times_seen: 1,
                        times_exempted: pattern.exempted ? 1 : 0,
                        times_rejected: pattern.exempted ? 0 : 1,
                        confidence: confidence.toFixed(4),
                        exemption_rate: exemptionRate.toFixed(4),  // ✅ Add exemption_rate
                        programme_context: pattern.programme || null
                    })
                    .select()
                    .single();

                if (insertError) throw insertError;

                return { success: true, action: 'created', id: inserted.id };
            }

        } catch (error) {
            console.error('Error recording pattern:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Save complete analysis result to Supabase
     */
    async saveAnalysisResult(analysisData) {
        if (!this.isConnected) {
            console.warn('Supabase not connected - skipping cloud save');
            return { success: false, error: 'Not connected' };
        }

        try {
            const { data, error } = await this.client
                .from('analysis_results')
                .insert({
                    programme_code: analysisData.programmeCode,
                    programme_name: analysisData.programmeName,
                    transcript_subjects: analysisData.transcriptSubjects,
                    exemption_results: analysisData.exemptionResults,
                    total_subjects_analyzed: analysisData.totalAnalyzed,
                    total_exemptions_granted: analysisData.totalExempted,
                    total_exemptions_rejected: analysisData.totalRejected,
                    user_edited: analysisData.userEdited || false,
                    student_id: analysisData.studentId || null,
                    application_reference: analysisData.applicationRef || null,
                    academic_year: analysisData.academicYear || null,
                    notes: analysisData.notes || null
                })
                .select()
                .single();

            if (error) throw error;

            console.log('✅ Analysis result saved to Supabase:', data.id);
            return { success: true, id: data.id };

        } catch (error) {
            console.error('Error saving analysis result:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Batch record multiple exemption patterns
     */
    async recordBatchPatterns(patterns) {
        if (!this.isConnected) {
            return { success: false, error: 'Not connected' };
        }

        const results = [];
        for (const pattern of patterns) {
            const result = await this.recordExemptionPattern(pattern);
            results.push(result);
        }

        const successCount = results.filter(r => r.success).length;
        return {
            success: true,
            total: patterns.length,
            successful: successCount,
            failed: patterns.length - successCount,
            results: results
        };
    },

    /**
     * Get recent analysis history
     */
    async getRecentAnalyses(limit = 10) {
        if (!this.isConnected) {
            return { success: false, error: 'Not connected' };
        }

        try {
            const { data, error } = await this.client
                .from('analysis_results')
                .select('*')
                .order('analysis_date', { ascending: false })
                .limit(limit);

            if (error) throw error;

            return { success: true, data: data };

        } catch (error) {
            console.error('Error fetching analyses:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get learning statistics
     */
    async getStats() {
        if (!this.isConnected) {
            return { success: false, error: 'Not connected' };
        }

        try {
            const { data, error } = await this.client
                .from('learning_stats')
                .select('*')
                .single();

            if (error) throw error;

            return { success: true, data: data };

        } catch (error) {
            console.error('Error fetching stats:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get relevant patterns for smart pattern matching
     * @param {Array} subjects - List of subject names from transcript
     * @param {Number} minConfidence - Minimum confidence threshold (default 0.3)
     * @returns {Object} Patterns grouped by subject name
     */
    async getRelevantPatterns(subjects, minConfidence = 0.3) {
        if (!this.isConnected) {
            console.warn('Supabase not connected - no patterns available');
            return {};
        }

        try {
            if (!subjects || subjects.length === 0) {
                return {};
            }

            // Normalize subjects for matching
            const normalizedSubjects = subjects.map(subject =>
                this.normalizeSubject(subject)
            );

            // Query Supabase for matching patterns
            const { data, error } = await this.client
                .from('exemption_patterns')
                .select('*')
                .in('previous_normalized', normalizedSubjects)
                .gte('confidence', minConfidence)
                .order('confidence', { ascending: false });

            if (error) throw error;

            // Group patterns by original subject (same format as pattern-retriever.js)
            const patternsBySubject = {};

            for (const subject of subjects) {
                const normalized = this.normalizeSubject(subject);
                const matchingPatterns = data.filter(
                    pattern => pattern.previous_normalized === normalized
                );

                if (matchingPatterns.length > 0) {
                    patternsBySubject[subject] = {
                        normalized: normalized,
                        patterns: matchingPatterns.map(pattern => ({
                            hkitSubject: pattern.hkit_subject,
                            confidence: parseFloat(pattern.confidence || 0),
                            weightedConfidence: parseFloat(pattern.weighted_confidence || 0),
                            effectiveConfidence: parseFloat(pattern.weighted_confidence || pattern.confidence || 0),
                            exemptionRate: parseFloat(pattern.exemption_rate || 0),
                            sampleSize: pattern.times_seen || 0,
                            programmeContext: pattern.programme_context,
                            lastSeen: pattern.last_updated,
                            confidenceUpdatedAt: pattern.confidence_updated_at,
                            daysSinceUpdate: 0  // Could calculate if needed
                        }))
                    };
                }
            }

            console.log(`📊 Retrieved ${Object.keys(patternsBySubject).length} pattern groups from Supabase`);
            return patternsBySubject;

        } catch (error) {
            console.error('Error fetching patterns:', error);
            return {};
        }
    },

    /**
     * Normalize subject name for consistency
     */
    normalizeSubject(subject) {
        if (!subject) return '';

        return subject
            .toLowerCase()
            .trim()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .replace(/\b(skill|skills|course|subject|class)\b/gi, '')
            .replace(/\b(i{1,3}|iv|v|vi{1,3})\b/gi, '')
            .replace(/\b\d+\b/g, '')
            .replace(/\s+/g, '_')
            .replace(/^_|_$/g, '');
    },

    /**
     * Check connection status
     */
    async checkConnection() {
        if (!this.client) return false;

        try {
            const { data, error } = await this.client
                .from('exemption_patterns')
                .select('count')
                .limit(1);

            return !error;
        } catch {
            return false;
        }
    }
};

// Auto-initialize if credentials are available in global config
if (typeof window !== 'undefined') {
    window.SupabaseClient = SupabaseClient;
}
