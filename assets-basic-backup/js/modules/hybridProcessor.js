/**
 * Hybrid Processor - Intelligent routing between processing methods
 * Automatically handles Vercel timeout limitations by choosing optimal processing strategy
 */

class HybridProcessor {
    constructor() {
        this.processors = {
            vercel: null,        // Standard Vercel function
            chunked: null,       // Chunked processing
            fallback: null       // Client-side fallback
        };
        this.statistics = {
            totalProcessed: 0,
            successfulVercel: 0,
            successfulChunked: 0,
            successfulFallback: 0,
            timeouts: 0,
            errors: 0
        };
        this.preferences = {
            preferredMethod: 'auto',
            fallbackEnabled: true,
            maxRetries: 2,
            timeoutThreshold: 8000 // 8 seconds
        };
    }

    /**
     * Initialize hybrid processor with dependencies
     */
    async initialize(options = {}) {
        const {
            chunkProcessor = null,
            fallbackProcessor = null,
            apiKey = null
        } = options;

        // Load processors
        if (typeof window !== 'undefined') {
            this.processors.chunked = window.ChunkProcessor || chunkProcessor;
            this.processors.fallback = window.FallbackProcessor || fallbackProcessor;
        } else {
            this.processors.chunked = chunkProcessor;
            this.processors.fallback = fallbackProcessor;
        }

        // Initialize fallback processor if API key provided
        if (apiKey && this.processors.fallback) {
            try {
                await this.processors.fallback.initialize(apiKey);
                console.log('✅ Fallback processor initialized');
            } catch (error) {
                console.warn('⚠️ Fallback processor initialization failed:', error.message);
                this.preferences.fallbackEnabled = false;
            }
        }

        console.log('🔧 Hybrid processor initialized');
        return this.getStatus();
    }

    /**
     * Process files using optimal strategy
     */
    async processFiles(prompt, files = [], options = {}) {
        console.log('🚀 Starting hybrid processing...');
        
        const {
            onProgress = null,
            onComplete = null,
            onError = null,
            onFallback = null,
            retryCount = 0
        } = options;

        this.statistics.totalProcessed++;

        try {
            // Determine optimal processing strategy
            const strategy = this.determineStrategy(files, prompt, options);
            console.log(`📊 Selected strategy: ${strategy.method} (${strategy.reason})`);

            if (onProgress) {
                onProgress({
                    stage: 'strategy_selected',
                    strategy: strategy.method,
                    reason: strategy.reason
                });
            }

            // Execute strategy
            const result = await this.executeStrategy(strategy, prompt, files, {
                ...options,
                onProgress,
                retryCount
            });

            // Update statistics
            this.updateSuccessStats(strategy.method);

            if (onComplete) {
                onComplete(result, strategy.method);
            }

            return result;

        } catch (error) {
            console.error('❌ Hybrid processing error:', error);
            this.statistics.errors++;

            // Try fallback or retry logic
            const fallbackResult = await this.handleProcessingError(
                error, 
                prompt, 
                files, 
                { ...options, retryCount: retryCount + 1 }
            );

            if (fallbackResult) {
                if (onComplete) {
                    onComplete(fallbackResult, 'fallback_recovery');
                }
                return fallbackResult;
            }

            // If all else fails, propagate error
            if (onError) {
                onError(error, 'hybrid_processing');
            }
            throw error;
        }
    }

    /**
     * Determine optimal processing strategy
     */
    determineStrategy(files, prompt, options = {}) {
        const analysis = this.analyzeRequirements(files, prompt);
        const { preferredMethod } = this.preferences;

        console.log('📋 Processing analysis:', analysis);

        // Forced method selection
        if (preferredMethod !== 'auto' && preferredMethod !== 'hybrid') {
            return {
                method: preferredMethod,
                reason: 'User preference override'
            };
        }

        // Strategy selection based on analysis
        if (analysis.totalSize <= 500 * 1024 && analysis.fileCount <= 2) {
            // Small files - try standard Vercel function first
            return {
                method: 'vercel',
                reason: `Small payload (${(analysis.totalSize / 1024).toFixed(1)}KB, ${analysis.fileCount} files)`
            };
        } else if (analysis.totalSize <= 5 * 1024 * 1024 && analysis.fileCount <= 8) {
            // Medium files - use chunked processing
            return {
                method: 'chunked',
                reason: `Medium payload (${(analysis.totalSize / 1024 / 1024).toFixed(1)}MB, ${analysis.fileCount} files)`
            };
        } else {
            // Large files - use fallback if available, otherwise chunked
            if (this.processors.fallback && this.processors.fallback.isReady()) {
                return {
                    method: 'fallback',
                    reason: `Large payload (${(analysis.totalSize / 1024 / 1024).toFixed(1)}MB) - direct API recommended`
                };
            } else {
                return {
                    method: 'chunked',
                    reason: 'Large payload - chunked processing (fallback not available)'
                };
            }
        }
    }

    /**
     * Analyze processing requirements
     */
    analyzeRequirements(files, prompt) {
        const totalSize = files.reduce((sum, fileObj) => {
            return sum + (fileObj.file ? fileObj.file.size : 0);
        }, 0);

        const promptSize = new Blob([prompt]).size;
        const estimatedPayloadSize = totalSize * 1.4 + promptSize; // Base64 overhead

        return {
            fileCount: files.length,
            totalSize,
            promptSize,
            estimatedPayloadSize,
            hasLargeFiles: files.some(f => f.file && f.file.size > 2 * 1024 * 1024),
            averageFileSize: files.length > 0 ? totalSize / files.length : 0
        };
    }

    /**
     * Execute selected processing strategy
     */
    async executeStrategy(strategy, prompt, files, options) {
        const startTime = Date.now();

        switch (strategy.method) {
            case 'vercel':
                return await this.executeVercelStrategy(prompt, files, options);
                
            case 'chunked':
                return await this.executeChunkedStrategy(prompt, files, options);
                
            case 'fallback':
                return await this.executeFallbackStrategy(prompt, files, options);
                
            default:
                throw new Error(`Unknown processing strategy: ${strategy.method}`);
        }
    }

    /**
     * Execute standard Vercel function strategy
     */
    async executeVercelStrategy(prompt, files, options) {
        console.log('⚡ Executing Vercel strategy...');
        
        const { onProgress, timeout = this.preferences.timeoutThreshold } = options;

        if (onProgress) {
            onProgress({ stage: 'vercel_processing', message: 'Processing via Vercel Functions' });
        }

        const requestData = {
            prompt,
            files: await this.prepareFilesForVercel(files),
            model: options.model || 'gemini-1.5-flash'
        };

        const response = await Promise.race([
            fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            }),
            new Promise((_, reject) => 
                setTimeout(() => {
                    this.statistics.timeouts++;
                    reject(new Error('Vercel function timeout'));
                }, timeout)
            )
        ]);

        if (!response.ok) {
            throw new Error(`Vercel API error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Vercel processing failed');
        }

        return {
            success: true,
            results: this.parseGeminiResponse(result.data.text),
            processingType: 'vercel_direct',
            processingTime: Date.now() - Date.now()
        };
    }

    /**
     * Execute chunked processing strategy
     */
    async executeChunkedStrategy(prompt, files, options) {
        console.log('🔄 Executing chunked strategy...');
        
        if (!this.processors.chunked) {
            throw new Error('Chunked processor not available');
        }

        return await this.processors.chunked.processFiles(prompt, files, {
            ...options,
            useChunkedAPI: true,
            fallbackToLocal: false
        });
    }

    /**
     * Execute fallback processing strategy
     */
    async executeFallbackStrategy(prompt, files, options) {
        console.log('🔄 Executing fallback strategy...');
        
        if (!this.processors.fallback || !this.processors.fallback.isReady()) {
            throw new Error('Fallback processor not available or not initialized');
        }

        return await this.processors.fallback.processFiles(prompt, files, options);
    }

    /**
     * Handle processing errors with fallback logic
     */
    async handleProcessingError(error, prompt, files, options) {
        const { retryCount = 0, onProgress, onFallback } = options;
        
        console.log(`⚠️ Processing error (attempt ${retryCount + 1}):`, error.message);

        // Don't retry too many times
        if (retryCount >= this.preferences.maxRetries) {
            console.log('❌ Max retries reached');
            return null;
        }

        // Determine fallback strategy based on error type
        let fallbackStrategy = null;

        if (error.message.includes('timeout')) {
            // Timeout error - try chunked or fallback
            if (this.processors.fallback && this.processors.fallback.isReady()) {
                fallbackStrategy = 'fallback';
            } else if (this.processors.chunked) {
                fallbackStrategy = 'chunked';
            }
        } else if (error.message.includes('rate limit') || error.message.includes('quota')) {
            // Rate limit error - wait and retry or use fallback
            await this.waitWithBackoff(retryCount);
            
            if (this.processors.fallback && this.processors.fallback.isReady()) {
                fallbackStrategy = 'fallback';
            }
        } else if (error.message.includes('payload too large') || error.message.includes('file size')) {
            // Size error - use chunked or fallback
            if (this.processors.fallback && this.processors.fallback.isReady()) {
                fallbackStrategy = 'fallback';
            } else if (this.processors.chunked) {
                fallbackStrategy = 'chunked';
            }
        }

        if (!fallbackStrategy) {
            console.log('❌ No fallback strategy available');
            return null;
        }

        try {
            if (onFallback) {
                onFallback(error, fallbackStrategy);
            }

            if (onProgress) {
                onProgress({
                    stage: 'fallback_activated',
                    message: `Switching to ${fallbackStrategy} processing due to: ${error.message}`
                });
            }

            const strategy = {
                method: fallbackStrategy,
                reason: `Fallback due to: ${error.message}`
            };

            const result = await this.executeStrategy(strategy, prompt, files, {
                ...options,
                retryCount: retryCount + 1
            });

            this.updateSuccessStats(fallbackStrategy);
            return result;

        } catch (fallbackError) {
            console.error('❌ Fallback strategy also failed:', fallbackError);
            return null;
        }
    }

    /**
     * Wait with exponential backoff
     */
    async waitWithBackoff(retryCount) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Max 10 seconds
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * Prepare files for Vercel API
     */
    async prepareFilesForVercel(files) {
        const prepared = [];
        
        for (const fileObj of files) {
            if (fileObj.file && fileObj.file.type === 'application/pdf') {
                const arrayBuffer = await fileObj.file.arrayBuffer();
                const base64Data = this.arrayBufferToBase64(arrayBuffer);
                
                prepared.push({
                    name: fileObj.name || fileObj.file.name,
                    mimeType: 'application/pdf',
                    data: base64Data
                });
            }
        }
        
        return prepared;
    }

    /**
     * Convert ArrayBuffer to Base64
     */
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.slice(i, i + chunkSize);
            binary += String.fromCharCode.apply(null, chunk);
        }
        
        return btoa(binary);
    }

    /**
     * Parse Gemini response
     */
    parseGeminiResponse(text) {
        try {
            const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(cleanText);
        } catch (error) {
            throw new Error('Failed to parse AI response');
        }
    }

    /**
     * Update success statistics
     */
    updateSuccessStats(method) {
        switch (method) {
            case 'vercel':
                this.statistics.successfulVercel++;
                break;
            case 'chunked':
                this.statistics.successfulChunked++;
                break;
            case 'fallback':
                this.statistics.successfulFallback++;
                break;
        }
    }

    /**
     * Get processor status and statistics
     */
    getStatus() {
        const availableProcessors = {
            vercel: true, // Always available
            chunked: !!this.processors.chunked,
            fallback: !!(this.processors.fallback && this.processors.fallback.isReady())
        };

        return {
            available: availableProcessors,
            preferences: this.preferences,
            statistics: this.statistics,
            ready: availableProcessors.vercel || availableProcessors.chunked || availableProcessors.fallback
        };
    }

    /**
     * Update preferences
     */
    updatePreferences(newPreferences) {
        this.preferences = { ...this.preferences, ...newPreferences };
        console.log('🔧 Preferences updated:', this.preferences);
    }

    /**
     * Reset statistics
     */
    resetStatistics() {
        this.statistics = {
            totalProcessed: 0,
            successfulVercel: 0,
            successfulChunked: 0,
            successfulFallback: 0,
            timeouts: 0,
            errors: 0
        };
    }

    /**
     * Get processing recommendations based on file characteristics
     */
    getRecommendation(files, prompt) {
        const analysis = this.analyzeRequirements(files, prompt);
        const strategy = this.determineStrategy(files, prompt);
        
        return {
            analysis,
            recommendation: strategy,
            alternatives: this.getAlternativeStrategies(analysis)
        };
    }

    /**
     * Get alternative processing strategies
     */
    getAlternativeStrategies(analysis) {
        const alternatives = [];
        
        if (analysis.totalSize <= 1 * 1024 * 1024) {
            alternatives.push({
                method: 'vercel',
                pros: ['Fast', 'Server-side', 'No API key needed'],
                cons: ['10-second timeout risk']
            });
        }
        
        alternatives.push({
            method: 'chunked',
            pros: ['Handles large files', 'Progress tracking', 'Reliable'],
            cons: ['Slower', 'More complex']
        });
        
        if (this.processors.fallback) {
            alternatives.push({
                method: 'fallback',
                pros: ['No timeout limits', 'Full Gemini features', 'Fastest for large files'],
                cons: ['Requires API key', 'Client-side processing']
            });
        }
        
        return alternatives;
    }
}

// Export singleton instance
const hybridProcessor = new HybridProcessor();

// Make available globally
if (typeof window !== 'undefined') {
    window.HybridProcessor = hybridProcessor;
}

// Export for CommonJS (Node.js testing)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HybridProcessor;
}