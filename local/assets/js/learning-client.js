/**
 * Learning Database Browser Client
 * Browser-compatible API client to communicate with learning server
 */

class LearningClient {
    constructor(serverUrl = 'http://localhost:3001') {
        this.serverUrl = serverUrl;
        this.isConnected = false;
        this.lastError = null;
    }

    /**
     * Make API request with error handling
     */
    async apiRequest(endpoint, options = {}) {
        const url = `${this.serverUrl}/api/learning${endpoint}`;
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.isConnected = true;
            this.lastError = null;
            
            return data;
        } catch (error) {
            this.isConnected = false;
            this.lastError = error.message;
            console.error(`Learning API error (${endpoint}):`, error);
            throw error;
        }
    }

    /**
     * Check server health and connection
     */
    async checkHealth() {
        try {
            const response = await fetch(`${this.serverUrl}/api/health`);
            if (response.ok) {
                const data = await response.json();
                this.isConnected = true;
                return data;
            }
            throw new Error(`Health check failed: ${response.status}`);
        } catch (error) {
            this.isConnected = false;
            this.lastError = error.message;
            return null;
        }
    }

    /**
     * Get learning system status
     */
    async getSystemStatus() {
        try {
            const response = await this.apiRequest('/status');
            return response.success ? response.data : null;
        } catch (error) {
            console.warn('Failed to get system status:', error.message);
            return {
                connected: false,
                error: error.message,
                totalPatterns: 0,
                avgConfidence: 0
            };
        }
    }

    /**
     * Stage 1: Gather learning context for extracted subjects
     */
    async gatherLearningContext(subjects, programmeContext = null) {
        if (!subjects || subjects.length === 0) {
            return { hasLearningData: false, message: 'No subjects provided' };
        }

        try {
            console.log(`🔍 Gathering learning context for ${subjects.length} subjects...`);
            
            const response = await this.apiRequest('/context', {
                method: 'POST',
                body: JSON.stringify({
                    subjects: subjects,
                    programmeContext: programmeContext
                })
            });

            if (response.success) {
                const context = response.data;
                if (context.hasLearningData) {
                    console.log(`✅ Learning context found: ${context.totalSubjectsWithPatterns} subjects with patterns`);
                } else {
                    console.log('ℹ️ No relevant learning patterns found');
                }
                return context;
            }
            
            return { hasLearningData: false, error: 'API call failed' };
            
        } catch (error) {
            console.warn('Learning context gathering failed:', error.message);
            return { hasLearningData: false, error: error.message };
        }
    }

    /**
     * Stage 2: Enhance analysis prompt with learning patterns
     */
    async enhancePrompt(originalPrompt, programmeContext = null) {
        if (!originalPrompt) {
            return originalPrompt;
        }

        try {
            console.log('🎯 Enhancing prompt with historical patterns...');
            
            const response = await this.apiRequest('/enhance', {
                method: 'POST',
                body: JSON.stringify({
                    prompt: originalPrompt,
                    programmeContext: programmeContext
                })
            });

            if (response.success && response.data.enhanced) {
                console.log('✨ Prompt enhanced with learning data');
                return response.data.enhancedPrompt;
            }
            
            return originalPrompt;
            
        } catch (error) {
            console.warn('Prompt enhancement failed, using original:', error.message);
            return originalPrompt;
        }
    }

    /**
     * Post-Stage 2: Record analysis results for learning
     */
    async recordAnalysisResults(analysisResults, programmeContext = null) {
        if (!analysisResults || !Array.isArray(analysisResults)) {
            console.warn('No valid analysis results to record');
            return;
        }

        try {
            console.log(`📊 Recording ${analysisResults.length} exemption decisions...`);
            console.log('🔍 Debug: First analysis result:', analysisResults[0]);
            console.log(`🔍 Debug: ${analysisResults.filter(r => !r['Subject Name of Previous Studies'] || r['Subject Name of Previous Studies'].trim() === '').length} results have empty Subject Name of Previous Studies`);
            
            const response = await this.apiRequest('/record', {
                method: 'POST',
                body: JSON.stringify({
                    analysisResults: analysisResults,
                    programmeContext: programmeContext
                })
            });

            if (response.success) {
                const recordedCount = response.data.recordedPatterns;
                console.log(`✅ Recorded ${recordedCount} patterns for future learning`);
                return response.data;
            }
            
            console.warn('Failed to record analysis results');
            return null;
            
        } catch (error) {
            console.error('Failed to record learning patterns:', error.message);
            throw error;
        }
    }

    /**
     * Get dashboard statistics
     */
    async getDashboardStats() {
        try {
            const response = await this.apiRequest('/dashboard');
            return response.success ? response.data : null;
        } catch (error) {
            console.warn('Failed to get dashboard stats:', error.message);
            return null;
        }
    }

    /**
     * Get relevant patterns for specific subjects
     */
    async getRelevantPatterns(subjects, minConfidence = 0.3) {
        if (!subjects || subjects.length === 0) {
            return {};
        }

        try {
            const response = await this.apiRequest('/patterns', {
                method: 'POST',
                body: JSON.stringify({
                    subjects: subjects,
                    minConfidence: minConfidence
                })
            });

            return response.success ? response.data : {};
            
        } catch (error) {
            console.warn('Failed to get relevant patterns:', error.message);
            return {};
        }
    }

    /**
     * Connection status check
     */
    isServerConnected() {
        return this.isConnected;
    }

    /**
     * Get last error message
     */
    getLastError() {
        return this.lastError;
    }
}

// Browser-compatible export
if (typeof window !== 'undefined') {
    window.LearningClient = LearningClient;
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = LearningClient;
}