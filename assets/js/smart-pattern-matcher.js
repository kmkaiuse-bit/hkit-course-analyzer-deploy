/**
 * Smart Pattern Matcher
 * Automatically applies high-confidence patterns and optimizes AI usage
 */

const SmartPatternMatcher = {
    // Configuration thresholds
    config: {
        AUTO_APPLY_THRESHOLD: 0.90,    // 90%+ confidence = auto-apply
        STRONG_HINT_THRESHOLD: 0.70,   // 70-90% confidence = strong AI hint
        WEAK_HINT_THRESHOLD: 0.50,     // 50-70% confidence = weak AI hint
        MIN_SAMPLE_SIZE: 2,            // Minimum observations required for auto-apply
        MAX_PATTERNS_IN_PROMPT: 15     // Limit patterns sent to AI
    },

    /**
     * Process extracted subjects with smart pattern matching
     * @param {Array} extractedSubjects - List of subjects from transcript
     * @param {Object} learningPatterns - Patterns from learning client
     * @param {Object} programmeTemplate - HKIT programme template
     * @returns {Object} Processing results with pre-applied and AI-pending courses
     */
    async processWithPatterns(extractedSubjects, learningPatterns, programmeTemplate) {
        console.log('🧠 Smart Pattern Matcher: Processing', extractedSubjects.length, 'subjects');
        
        const result = {
            preAppliedResults: [],      // Auto-applied high confidence patterns
            pendingForAI: [],          // Courses that need AI analysis
            strongHints: [],           // Medium confidence hints for AI
            weakHints: [],             // Low confidence hints for AI
            stats: {
                autoApplied: 0,
                pendingAnalysis: 0,
                totalPatterns: Object.keys(learningPatterns).length
            }
        };

        // Get all HKIT courses from template
        const hkitCourses = programmeTemplate.courses || [];
        
        // Process each HKIT course
        for (const hkitCourse of hkitCourses) {
            const courseResult = this.processHKITCourse(
                hkitCourse,
                extractedSubjects,
                learningPatterns
            );
            
            if (courseResult.action === 'AUTO_APPLY') {
                result.preAppliedResults.push(courseResult.result);
                result.stats.autoApplied++;
                console.log(`✅ Auto-applied: ${hkitCourse.code} ← "${courseResult.matchedSubject}" (${Math.round(courseResult.confidence * 100)}% confidence)`);
            } else if (courseResult.action === 'STRONG_HINT') {
                result.strongHints.push(courseResult);
                result.pendingForAI.push(hkitCourse);
            } else if (courseResult.action === 'WEAK_HINT') {
                result.weakHints.push(courseResult);
                result.pendingForAI.push(hkitCourse);
            } else {
                // No pattern or low confidence - let AI decide
                result.pendingForAI.push(hkitCourse);
            }
        }

        result.stats.pendingAnalysis = result.pendingForAI.length;
        
        console.log(`📊 Smart Pattern Results: ${result.stats.autoApplied} auto-applied, ${result.stats.pendingAnalysis} pending AI analysis`);
        
        return result;
    },

    /**
     * Process single HKIT course against extracted subjects and patterns
     */
    processHKITCourse(hkitCourse, extractedSubjects, learningPatterns) {
        let bestMatch = null;
        
        // Check each extracted subject against patterns for this HKIT course
        for (const extractedSubject of extractedSubjects) {
            const pattern = this.findBestPattern(hkitCourse.code, extractedSubject, learningPatterns);
            
            if (pattern && (!bestMatch || pattern.confidence > bestMatch.confidence)) {
                bestMatch = {
                    hkitCourse,
                    extractedSubject,
                    pattern,
                    confidence: pattern.confidence,
                    sampleSize: pattern.sampleSize
                };
            }
        }

        if (!bestMatch) {
            return { action: 'AI_ANALYZE' };
        }

        // Decision logic based on confidence and sample size
        if (bestMatch.confidence >= this.config.AUTO_APPLY_THRESHOLD && 
            bestMatch.sampleSize >= this.config.MIN_SAMPLE_SIZE) {
            
            return {
                action: 'AUTO_APPLY',
                matchedSubject: bestMatch.extractedSubject,
                confidence: bestMatch.confidence,
                result: this.createExemptionResult(bestMatch, 'AUTO_APPLIED')
            };
            
        } else if (bestMatch.confidence >= this.config.STRONG_HINT_THRESHOLD) {
            
            return {
                action: 'STRONG_HINT',
                hkitCourse: bestMatch.hkitCourse,
                matchedSubject: bestMatch.extractedSubject,
                confidence: bestMatch.confidence,
                hintText: this.createHintText(bestMatch, 'STRONG')
            };
            
        } else if (bestMatch.confidence >= this.config.WEAK_HINT_THRESHOLD) {
            
            return {
                action: 'WEAK_HINT',
                hkitCourse: bestMatch.hkitCourse,
                matchedSubject: bestMatch.extractedSubject,
                confidence: bestMatch.confidence,
                hintText: this.createHintText(bestMatch, 'WEAK')
            };
        }

        return { action: 'AI_ANALYZE' };
    },

    /**
     * Find best matching pattern for HKIT course and extracted subject
     */
    findBestPattern(hkitCourseCode, extractedSubject, learningPatterns) {
        // Look for patterns where this extracted subject has been seen
        for (const [previousSubject, patternData] of Object.entries(learningPatterns)) {
            if (this.isSubjectMatch(previousSubject, extractedSubject)) {
                // Find pattern for this specific HKIT course
                const pattern = patternData.patterns.find(p => p.hkitSubject === hkitCourseCode);
                if (pattern) {
                    return pattern;
                }
            }
        }
        return null;
    },

    /**
     * Check if two subject names are similar enough to match
     */
    isSubjectMatch(pattern, extracted) {
        // Simple fuzzy matching - can be improved
        const p = pattern.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
        const e = extracted.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
        
        // Exact match
        if (p === e) return true;
        
        // Check if one contains the other (with significant overlap)
        if (p.includes(e) || e.includes(p)) {
            const shorter = p.length < e.length ? p : e;
            const longer = p.length < e.length ? e : p;
            return shorter.length / longer.length >= 0.6; // 60% overlap
        }
        
        // Word overlap check
        const pWords = p.split(/\s+/).filter(w => w.length > 2);
        const eWords = e.split(/\s+/).filter(w => w.length > 2);
        
        if (pWords.length === 0 || eWords.length === 0) return false;
        
        const commonWords = pWords.filter(w => eWords.some(ew => ew.includes(w) || w.includes(ew)));
        const overlapRatio = commonWords.length / Math.min(pWords.length, eWords.length);
        
        return overlapRatio >= 0.5; // 50% word overlap
    },

    /**
     * Create exemption result for auto-applied patterns
     */
    createExemptionResult(match, source) {
        return {
            'HKIT Subject Code': match.hkitCourse.code,
            'HKIT Subject Name': match.hkitCourse.name,
            'Exemption Granted / study plan': match.pattern.exemptionRate >= 0.5 ? 'Exempted' : '',
            'Subject Name of Previous Studies': match.extractedSubject,
            'Exemption Granted': match.pattern.exemptionRate >= 0.5 ? 'TRUE' : 'FALSE',
            'Remarks': `${source}: ${Math.round(match.confidence * 100)}% confidence (${match.sampleSize} cases)`
        };
    },

    /**
     * Create hint text for AI prompt
     */
    createHintText(match, strength) {
        const rate = Math.round(match.pattern.exemptionRate * 100);
        const conf = Math.round(match.confidence * 100);
        
        if (strength === 'STRONG') {
            return `"${match.extractedSubject}" → ${match.hkitCourse.code} (${rate}% exemption rate, ${conf}% confidence)`;
        } else {
            return `"${match.extractedSubject}" → ${match.hkitCourse.code} (${rate}% rate, ${conf}% conf)`;
        }
    },

    /**
     * Generate optimized AI prompt with pre-applied results and hints
     */
    generateOptimizedPrompt(templateCSV, transcriptContent, programmeName, smartResult) {
        let prompt = `HKIT Course Exemption Analysis - ${programmeName}\n\n`;

        // Add pre-applied exemptions section
        if (smartResult.preAppliedResults.length > 0) {
            prompt += `PRE-APPLIED EXEMPTIONS (Based on high-confidence patterns - DO NOT RE-ANALYZE):\n`;
            smartResult.preAppliedResults.forEach(result => {
                const status = result['Exemption Granted'] === 'TRUE' ? '✅ EXEMPTED' : '❌ NOT EXEMPTED';
                prompt += `• ${result['HKIT Subject Code']} - ${result['HKIT Subject Name']}: ${status}\n`;
                prompt += `  Matched: "${result['Subject Name of Previous Studies']}"\n`;
            });
            prompt += '\n';
        }

        // Add courses requiring AI analysis
        if (smartResult.pendingForAI.length > 0) {
            prompt += `COURSES REQUIRING ANALYSIS:\n`;
            const pendingCSV = smartResult.pendingForAI.map(course => 
                `${course.code},${course.name}`
            ).join('\n');
            prompt += pendingCSV + '\n\n';
        }

        // Add transcript
        if (transcriptContent) {
            prompt += `STUDENT TRANSCRIPTS:\n${transcriptContent}\n\n`;
        }

        // Add strong hints
        if (smartResult.strongHints.length > 0) {
            prompt += `STRONG HISTORICAL PATTERNS (Prioritize these suggestions):\n`;
            smartResult.strongHints.forEach(hint => {
                prompt += `• ${hint.hintText}\n`;
            });
            prompt += '\n';
        }

        // Add weak hints (limit to prevent token overflow)
        if (smartResult.weakHints.length > 0) {
            prompt += `HISTORICAL SUGGESTIONS (Consider if content matches):\n`;
            smartResult.weakHints.slice(0, this.config.MAX_PATTERNS_IN_PROMPT).forEach(hint => {
                prompt += `• ${hint.hintText}\n`;
            });
            prompt += '\n';
        }

        prompt += `TASK:\n`;
        prompt += `Analyze the transcript and determine exemptions for the ${smartResult.pendingForAI.length} courses requiring analysis.\n`;
        prompt += `Pre-applied exemptions are already decided based on 90%+ confidence patterns.\n`;
        prompt += `Focus on content matching between transcript subjects and HKIT courses.\n\n`;

        prompt += `OUTPUT FORMAT (JSON array, ONLY for courses requiring analysis):\n`;
        prompt += `[\n`;
        prompt += `  {\n`;
        prompt += `    "HKIT Subject Code": "[exact code]",\n`;
        prompt += `    "HKIT Subject Name": "[exact name]",\n`;
        prompt += `    "Exemption Granted / study plan": "Exempted" OR "",\n`;
        prompt += `    "Subject Name of Previous Studies": "[matched course]" OR "",\n`;
        prompt += `    "Exemption Granted": "TRUE" OR "FALSE",\n`;
        prompt += `    "Remarks": "[brief explanation]"\n`;
        prompt += `  }\n`;
        prompt += `]\n\n`;

        prompt += `IMPORTANT: Only analyze courses in "COURSES REQUIRING ANALYSIS" section. `;
        prompt += `Do not re-analyze pre-applied exemptions.`;

        return prompt;
    },

    /**
     * Merge AI results with pre-applied results
     */
    mergeResults(smartResult, aiResults) {
        const mergedResults = [...smartResult.preAppliedResults];
        
        if (aiResults && Array.isArray(aiResults)) {
            mergedResults.push(...aiResults);
        }

        console.log(`🔄 Merged Results: ${smartResult.preAppliedResults.length} pre-applied + ${aiResults?.length || 0} AI analyzed = ${mergedResults.length} total`);
        
        return mergedResults;
    }
};

// Browser-compatible export
if (typeof window !== 'undefined') {
    window.SmartPatternMatcher = SmartPatternMatcher;
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartPatternMatcher;
}