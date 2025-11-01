/**
 * Fallback Processor - Client-side processing when Vercel times out
 * Handles direct Gemini API calls from browser using user's API key
 */

class FallbackProcessor {
    constructor() {
        this.isAvailable = this.checkAvailability();
        this.apiKey = null;
        this.processingQueue = [];
        this.activeProcessing = false;
    }

    /**
     * Check if fallback processing is available
     */
    checkAvailability() {
        // Check for required browser APIs
        const hasRequiredAPIs = !!(
            window.fetch &&
            window.btoa &&
            window.atob &&
            window.FileReader
        );

        console.log('🔍 Fallback processor availability:', hasRequiredAPIs);
        return hasRequiredAPIs;
    }

    /**
     * Initialize fallback processor with user's API key
     */
    async initialize(apiKey) {
        if (!this.isAvailable) {
            throw new Error('Fallback processor not available in this environment');
        }

        if (!apiKey || apiKey.trim().length === 0) {
            throw new Error('API key is required for fallback processing');
        }

        this.apiKey = apiKey.trim();
        
        // Test API key validity
        try {
            await this.testAPIKey();
            console.log('✅ Fallback processor initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ API key test failed:', error);
            throw new Error(`Invalid API key: ${error.message}`);
        }
    }

    /**
     * Test API key validity
     */
    async testAPIKey() {
        const testUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`;
        
        const response = await fetch(testUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'API key validation failed');
        }

        return true;
    }

    /**
     * Process files using direct Gemini API
     */
    async processFiles(prompt, files = [], options = {}) {
        if (!this.isAvailable) {
            throw new Error('Fallback processing not available');
        }

        if (!this.apiKey) {
            throw new Error('Fallback processor not initialized. Please provide API key.');
        }

        console.log('🔄 Starting fallback processing...');

        const {
            model = 'gemini-2.5-flash',
            onProgress = null,
            chunkSize = 3, // Smaller chunks for client-side processing
            timeout = 25000 // 25 second timeout for direct API
        } = options;

        try {
            if (onProgress) {
                onProgress({ stage: 'preparing', message: 'Preparing files for processing' });
            }

            // Prepare files for API
            const processedFiles = await this.prepareFiles(files, onProgress);

            if (onProgress) {
                onProgress({ stage: 'processing', message: 'Analyzing with AI' });
            }

            // Determine processing strategy
            const strategy = this.determineStrategy(processedFiles, prompt);
            
            let results;
            if (strategy.type === 'single') {
                results = await this.processSingle(prompt, processedFiles, model, timeout);
            } else {
                results = await this.processChunked(prompt, processedFiles, {
                    model,
                    chunkSize,
                    timeout,
                    onProgress
                });
            }

            if (onProgress) {
                onProgress({ 
                    stage: 'completed', 
                    message: 'Processing completed',
                    results 
                });
            }

            return {
                success: true,
                results,
                processingType: 'fallback_' + strategy.type,
                source: 'client_side'
            };

        } catch (error) {
            console.error('❌ Fallback processing failed:', error);
            
            if (onProgress) {
                onProgress({ 
                    stage: 'error', 
                    message: error.message,
                    error 
                });
            }

            throw error;
        }
    }

    /**
     * Prepare files for API processing
     */
    async prepareFiles(files, onProgress = null) {
        const prepared = [];
        
        for (let i = 0; i < files.length; i++) {
            const fileObj = files[i];
            
            if (onProgress) {
                onProgress({
                    stage: 'preparing',
                    message: `Processing file ${i + 1}/${files.length}: ${fileObj.name}`,
                    progress: { current: i + 1, total: files.length }
                });
            }

            if (fileObj.file && fileObj.file.type === 'application/pdf') {
                try {
                    // Check file size (Gemini has ~20MB limit)
                    if (fileObj.file.size > 20 * 1024 * 1024) {
                        throw new Error(`File too large: ${fileObj.name}. Maximum size is 20MB.`);
                    }

                    const base64Data = await this.fileToBase64(fileObj.file);
                    
                    prepared.push({
                        name: fileObj.name || fileObj.file.name,
                        mimeType: 'application/pdf',
                        data: base64Data,
                        size: fileObj.file.size
                    });

                } catch (error) {
                    console.error(`Failed to prepare file ${fileObj.name}:`, error);
                    throw new Error(`File preparation failed: ${fileObj.name} - ${error.message}`);
                }
            }
        }
        
        return prepared;
    }

    /**
     * Convert file to base64
     */
    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = () => {
                try {
                    // Extract base64 data without data URL prefix
                    const base64 = reader.result.split(',')[1];
                    resolve(base64);
                } catch (error) {
                    reject(new Error('Failed to convert file to base64'));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsDataURL(file);
        });
    }

    /**
     * Determine processing strategy
     */
    determineStrategy(files, prompt) {
        const totalSize = files.reduce((sum, f) => sum + f.size, 0);
        const promptSize = new Blob([prompt]).size;
        
        // Estimate total payload size
        const estimatedPayloadSize = totalSize * 1.4 + promptSize; // Base64 overhead ~40%
        
        // Conservative limits for direct API calls
        const SINGLE_CALL_LIMIT = 5 * 1024 * 1024; // 5MB
        const FILE_COUNT_LIMIT = 3;

        if (files.length <= FILE_COUNT_LIMIT && estimatedPayloadSize <= SINGLE_CALL_LIMIT) {
            return { type: 'single', reason: 'Small payload suitable for single call' };
        } else {
            return { type: 'chunked', reason: 'Large payload requires chunking' };
        }
    }

    /**
     * Process all files in single API call
     */
    async processSingle(prompt, files, model, timeout) {
        console.log('⚡ Processing as single call');
        
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
        
        const requestBody = this.buildRequestBody(prompt, files);
        
        const response = await Promise.race([
            fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), timeout)
            )
        ]);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return this.parseGeminiResponse(data);
    }

    /**
     * Process files in chunks
     */
    async processChunked(prompt, files, options) {
        console.log('🔄 Processing as chunked calls');
        
        const { chunkSize, model, timeout, onProgress } = options;
        const chunks = this.chunkFiles(files, chunkSize);
        const results = [];

        for (let i = 0; i < chunks.length; i++) {
            if (onProgress) {
                onProgress({
                    stage: 'processing',
                    message: `Processing chunk ${i + 1}/${chunks.length}`,
                    progress: { current: i + 1, total: chunks.length }
                });
            }

            try {
                const chunkResult = await this.processSingle(prompt, chunks[i], model, timeout);
                results.push(...chunkResult);
                
                // Small delay between chunks to avoid rate limiting
                if (i < chunks.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
            } catch (error) {
                console.error(`Chunk ${i + 1} failed:`, error);
                // Continue with other chunks, but log the error
                results.push({
                    error: `Chunk ${i + 1} failed: ${error.message}`,
                    files: chunks[i].map(f => f.name)
                });
            }
        }

        return results;
    }

    /**
     * Split files into chunks
     */
    chunkFiles(files, chunkSize) {
        const chunks = [];
        for (let i = 0; i < files.length; i += chunkSize) {
            chunks.push(files.slice(i, i + chunkSize));
        }
        return chunks;
    }

    /**
     * Build request body for Gemini API
     */
    buildRequestBody(prompt, files) {
        const parts = [{ text: prompt }];
        
        files.forEach(file => {
            parts.push({
                inlineData: {
                    mimeType: file.mimeType,
                    data: file.data
                }
            });
        });

        return {
            contents: [{ parts }],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 8192,
                topP: 0.9,
                topK: 40
            }
        };
    }

    /**
     * Parse Gemini API response
     */
    parseGeminiResponse(response) {
        try {
            if (!response.candidates || response.candidates.length === 0) {
                throw new Error('No candidates in response');
            }

            const candidate = response.candidates[0];
            if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
                throw new Error('No content in response');
            }

            const text = candidate.content.parts[0].text;
            const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            
            return JSON.parse(cleanText);
            
        } catch (error) {
            console.error('Failed to parse Gemini response:', error);
            throw new Error('Failed to parse AI response');
        }
    }

    /**
     * Get stored API key (if any)
     */
    getStoredAPIKey() {
        try {
            return localStorage.getItem('gemini_api_key');
        } catch (error) {
            console.warn('Cannot access localStorage:', error);
            return null;
        }
    }

    /**
     * Store API key (optional)
     */
    storeAPIKey(apiKey, remember = false) {
        if (remember) {
            try {
                localStorage.setItem('gemini_api_key', apiKey);
            } catch (error) {
                console.warn('Cannot store API key:', error);
            }
        }
        this.apiKey = apiKey;
    }

    /**
     * Clear stored API key
     */
    clearStoredAPIKey() {
        try {
            localStorage.removeItem('gemini_api_key');
        } catch (error) {
            console.warn('Cannot clear API key:', error);
        }
        this.apiKey = null;
    }

    /**
     * Check if processor is initialized and ready
     */
    isReady() {
        return this.isAvailable && !!this.apiKey;
    }

    /**
     * Get processor status
     */
    getStatus() {
        return {
            available: this.isAvailable,
            initialized: !!this.apiKey,
            ready: this.isReady(),
            activeProcessing: this.activeProcessing,
            queueLength: this.processingQueue.length
        };
    }
}

// Export singleton instance
const fallbackProcessor = new FallbackProcessor();

// Make available globally
if (typeof window !== 'undefined') {
    window.FallbackProcessor = fallbackProcessor;
}

// Export for CommonJS (Node.js testing)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FallbackProcessor;
}