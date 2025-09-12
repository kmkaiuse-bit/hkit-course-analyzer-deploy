/**
 * Learning Engine - Main orchestrator for the learning database system
 * Integrates with existing Gemini API flow for pattern-enhanced analysis
 */

const PatternRetriever = require('./pattern-retriever');
const PatternRecorder = require('./pattern-recorder');
const dbConnection = require('./connection');

class LearningEngine {
    
    /**
     * Initialize learning system
     */
    static async initialize() {
        try {
            if (typeof process !== 'undefined' && process.env.LEARNING_ENABLED === 'false') {
                console.log('🚫 Learning system disabled in environment');
                return false;
            }

            await dbConnection.connect();
            console.log('🧠 Learning engine initialized');
            return true;
        } catch (error) {
            console.warn('⚠️ Learning engine initialization failed:', error.message);
            return false;
        }
    }

    /**
     * STAGE 1 ENHANCEMENT: Gather learning context during subject extraction
     * This runs in background, doesn't affect UI
     */
    static async gatherLearningContext(extractedSubjects, programmeContext = null) {
        try {
            if (!extractedSubjects || extractedSubjects.length === 0) {
                return { hasLearningData: false };
            }

            console.log(`🔍 Gathering learning context for ${extractedSubjects.length} subjects...`);
            
            const learningContext = await PatternRetriever.generateLearningContext(
                extractedSubjects, 
                programmeContext
            );

            // Store in session for Stage 2
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.setItem('learningContext', JSON.stringify({
                    timestamp: new Date().toISOString(),
                    programmeContext: programmeContext,
                    subjectCount: extractedSubjects.length,
                    ...learningContext
                }));
            }

            if (learningContext.hasLearningData) {
                console.log(`✅ Learning context prepared: ${learningContext.totalSubjectsWithPatterns} subjects with patterns`);
            } else {
                console.log('ℹ️ No relevant learning patterns found');
            }

            return learningContext;

        } catch (error) {
            console.error('Error gathering learning context:', error);
            return { hasLearningData: false, error: error.message };
        }
    }

    /**
     * STAGE 2 ENHANCEMENT: Enhance AI prompt with learning patterns
     */
    static async enhanceAnalysisPrompt(originalPrompt, programmeContext = null) {
        try {
            // Retrieve stored learning context from Stage 1
            let learningContext = null;
            
            if (typeof sessionStorage !== 'undefined') {
                const stored = sessionStorage.getItem('learningContext');
                if (stored) {
                    learningContext = JSON.parse(stored);
                }
            }

            if (!learningContext || !learningContext.hasLearningData) {
                console.log('ℹ️ No learning context available for prompt enhancement');
                return originalPrompt;
            }

            // Add learning enhancement to prompt
            const enhancedPrompt = originalPrompt + learningContext.promptEnhancement;
            
            console.log(`🎯 Prompt enhanced with ${learningContext.totalPatterns} historical patterns`);
            return enhancedPrompt;

        } catch (error) {
            console.error('Error enhancing prompt with learning data:', error);
            return originalPrompt;
        }
    }

    /**
     * STAGE 2 POST-PROCESSING: Record analysis results for learning
     */
    static async recordAnalysisResults(analysisResults, programmeContext = null) {
        try {
            if (!analysisResults || !Array.isArray(analysisResults)) {
                console.warn('⚠️ Invalid analysis results for learning');
                return;
            }

            console.log(`📊 Recording ${analysisResults.length} exemption decisions...`);

            // Convert analysis results to learning format
            console.log('🔍 Debug: Sample analysis result:', analysisResults[0]);
            const rawExemptions = analysisResults.map(result => ({
                hkitSubject: result['HKIT Subject Code'] || result.hkitSubjectCode,
                previousSubject: result['Subject Name of Previous Studies'] || result.previousSubject,
                decision: (result['Exemption Granted'] === 'TRUE' || 
                         result['Exemption Granted / study plan'] === 'Exempted') ? 'exempted' : 'rejected'
            }));
            
            console.log('🔍 Debug: Sample raw exemption:', rawExemptions[0]);
            console.log(`🔍 Debug: ${rawExemptions.filter(e => !e.previousSubject || e.previousSubject.trim() === '').length} exemptions have empty previousSubject`);
            
            const learningData = {
                exemptions: rawExemptions.filter(exemption => exemption.previousSubject && exemption.previousSubject.trim() !== '')
            };

            if (learningData.exemptions.length === 0) {
                console.log('ℹ️ No valid exemption patterns to record');
                return;
            }

            // Record the patterns
            const recordedPatterns = await PatternRecorder.recordAnalysisResults(
                learningData, 
                programmeContext
            );

            console.log(`✅ Recorded ${recordedPatterns.length} exemption patterns for future learning`);

            // Update learning statistics
            const stats = await PatternRecorder.getLearningStats();
            console.log(`📈 Learning system now has ${stats.total_patterns} total patterns`);

            return recordedPatterns;

        } catch (error) {
            console.error('Error recording analysis results:', error);
        }
    }

    /**
     * Get learning system status for UI display
     */
    static async getSystemStatus() {
        try {
            const health = await dbConnection.healthCheck();
            const dashStats = await PatternRetriever.getDashboardStats();

            return {
                connected: health.status === 'connected',
                totalPatterns: dashStats ? dashStats.totalPatterns : 0,
                lastUpdate: dashStats ? dashStats.lastUpdate : null,
                avgConfidence: dashStats ? Math.round(dashStats.avgConfidence * 100) : 0,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            return {
                connected: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Clean up resources
     */
    static async cleanup() {
        try {
            await dbConnection.disconnect();
            
            // Clear session storage
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.removeItem('learningContext');
            }
            
            console.log('🧹 Learning engine cleaned up');
        } catch (error) {
            console.warn('Warning during learning engine cleanup:', error);
        }
    }

    /**
     * Enhanced Stage 1 wrapper - maintains existing API but adds learning
     */
    static async enhancedExtractSubjects(originalExtractSubjectsFunction, transcriptText, files = [], programmeId = null) {
        try {
            // Call original extraction function
            const extractedSubjects = await originalExtractSubjectsFunction(transcriptText, files);
            
            // Gather learning context in background
            if (extractedSubjects && extractedSubjects.length > 0) {
                // Get programme context from programmeId
                let programmeContext = null;
                if (programmeId && typeof TemplateManager !== 'undefined') {
                    const programme = TemplateManager.getProgramme(programmeId);
                    programmeContext = programme ? programme.code : null;
                }
                
                // Non-blocking learning context gathering
                this.gatherLearningContext(extractedSubjects, programmeContext)
                    .catch(error => console.warn('Learning context gathering failed:', error));
            }
            
            return extractedSubjects;

        } catch (error) {
            console.error('Enhanced subject extraction failed:', error);
            // Fallback to original function
            return await originalExtractSubjectsFunction(transcriptText, files);
        }
    }

    /**
     * Enhanced Stage 2 wrapper - maintains existing API but adds learning
     */
    static async enhancedAnalyzeTranscripts(originalAnalyzeFunction, transcriptContent, programmeId, files = []) {
        try {
            // Get programme context
            let programmeContext = null;
            if (programmeId && typeof TemplateManager !== 'undefined') {
                const programme = TemplateManager.getProgramme(programmeId);
                programmeContext = programme ? programme.code : null;
            }

            // Enhance the analysis (this would require modifying createPrompt)
            // For now, we'll record results post-analysis
            
            // Call original analysis function
            const analysisResults = await originalAnalyzeFunction(transcriptContent, programmeId, files);
            
            // Record results for learning (non-blocking)
            if (analysisResults && Array.isArray(analysisResults)) {
                this.recordAnalysisResults(analysisResults, programmeContext)
                    .catch(error => console.warn('Learning recording failed:', error));
            }
            
            return analysisResults;

        } catch (error) {
            console.error('Enhanced transcript analysis failed:', error);
            // Fallback to original function
            return await originalAnalyzeFunction(transcriptContent, programmeId, files);
        }
    }
}

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
    // Browser environment
    document.addEventListener('DOMContentLoaded', () => {
        LearningEngine.initialize().catch(console.warn);
    });
} else if (typeof process !== 'undefined') {
    // Node.js environment
    LearningEngine.initialize().catch(console.warn);
}

module.exports = LearningEngine;