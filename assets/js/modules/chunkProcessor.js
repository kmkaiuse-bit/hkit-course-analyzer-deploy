/**
 * Chunk Processor - Handles chunked API processing and result aggregation
 * Designed to work with Vercel's 10-second timeout limitation
 */

class ChunkProcessor {
    constructor() {
        this.activeJobs = new Map();
        this.pollingIntervals = new Map();
        this.onProgressCallbacks = new Map();
        this.onCompleteCallbacks = new Map();
        this.onErrorCallbacks = new Map();
    }

    /**
     * Process files with chunking support
     * @param {string} prompt - Analysis prompt
     * @param {Array} files - File objects to process
     * @param {Object} options - Processing options
     * @returns {Promise} Processing results
     */
    async processFiles(prompt, files = [], options = {}) {
        console.log('🔄 Starting chunked file processing...');
        
        const {
            chunkSize = 5,
            useChunkedAPI = true,
            fallbackToLocal = true,
            onProgress = null,
            onComplete = null,
            onError = null
        } = options;

        try {
            // Determine processing strategy based on file size and count
            const totalSize = this.calculateTotalSize(files);
            const strategy = this.determineProcessingStrategy(files.length, totalSize);

            console.log(`📊 Processing strategy: ${strategy.type}, Total size: ${(totalSize / 1024).toFixed(1)}KB`);

            if (strategy.type === 'immediate' || !useChunkedAPI) {
                // Process immediately for small files
                return await this.processImmediate(prompt, files, options);
            } else {
                // Use chunked processing for larger files
                return await this.processChunked(prompt, files, { 
                    ...options, 
                    chunkSize,
                    onProgress,
                    onComplete,
                    onError 
                });
            }

        } catch (error) {
            console.error('❌ Chunk processor error:', error);
            
            if (fallbackToLocal && onError) {
                onError(error, 'chunk_processor');
            }
            
            throw error;
        }
    }

    /**
     * Calculate total size of all files
     */
    calculateTotalSize(files) {
        return files.reduce((total, fileObj) => {
            if (fileObj.file && fileObj.file.size) {
                return total + fileObj.file.size;
            }
            return total;
        }, 0);
    }

    /**
     * Determine the best processing strategy
     */
    determineProcessingStrategy(fileCount, totalSize) {
        const SIZE_THRESHOLD_SMALL = 500 * 1024; // 500KB
        const SIZE_THRESHOLD_LARGE = 2 * 1024 * 1024; // 2MB
        const COUNT_THRESHOLD = 3;

        if (fileCount <= COUNT_THRESHOLD && totalSize <= SIZE_THRESHOLD_SMALL) {
            return { type: 'immediate', reason: 'Small files' };
        } else if (totalSize >= SIZE_THRESHOLD_LARGE) {
            return { type: 'chunked_heavy', reason: 'Large files require chunking' };
        } else {
            return { type: 'chunked_light', reason: 'Medium files benefit from chunking' };
        }
    }

    /**
     * Process files immediately (small files)
     */
    async processImmediate(prompt, files, options) {
        console.log('⚡ Processing files immediately...');
        
        const requestData = {
            prompt,
            files: await this.prepareFilesForAPI(files),
            model: options.model || 'gemini-1.5-flash'
        };

        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'API processing failed');
        }

        // Parse and return results
        const parsedResults = this.parseGeminiResponse(result.data.text);
        
        if (options.onComplete) {
            options.onComplete(parsedResults, 'immediate');
        }

        return {
            success: true,
            completed: true,
            results: parsedResults,
            processingType: 'immediate'
        };
    }

    /**
     * Process files using chunked API
     */
    async processChunked(prompt, files, options) {
        console.log('🔄 Starting chunked processing...');
        
        const requestData = {
            prompt,
            files: await this.prepareFilesForAPI(files),
            chunkSize: options.chunkSize || 5,
            model: options.model || 'gemini-1.5-flash'
        };

        const response = await fetch('/api/gemini-chunked', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error(`Chunked API request failed: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Chunked API processing failed');
        }

        const jobId = result.jobId;
        console.log(`📋 Job created: ${jobId}`);

        // Store job info
        const jobInfo = {
            jobId,
            startTime: Date.now(),
            totalExpected: result.progress?.total || 1,
            completed: result.completed || false,
            results: result.data || []
        };

        this.activeJobs.set(jobId, jobInfo);

        // Set up callbacks
        if (options.onProgress) this.onProgressCallbacks.set(jobId, options.onProgress);
        if (options.onComplete) this.onCompleteCallbacks.set(jobId, options.onComplete);
        if (options.onError) this.onErrorCallbacks.set(jobId, options.onError);

        if (result.completed) {
            // Job completed immediately
            this.handleJobComplete(jobId, result.data);
            return {
                success: true,
                completed: true,
                results: result.data,
                jobId,
                processingType: 'chunked_immediate'
            };
        } else {
            // Start polling for updates
            this.startPolling(jobId);
            
            // Trigger initial progress update
            if (options.onProgress) {
                options.onProgress(result.progress, result.data, jobId);
            }

            return {
                success: true,
                completed: false,
                partial: true,
                results: result.data,
                jobId,
                progress: result.progress,
                processingType: 'chunked_polling'
            };
        }
    }

    /**
     * Start polling for job status updates
     */
    startPolling(jobId, interval = 2000) {
        if (this.pollingIntervals.has(jobId)) {
            return; // Already polling
        }

        console.log(`🔄 Starting polling for job ${jobId}`);
        
        const pollFunction = async () => {
            try {
                const status = await this.checkJobStatus(jobId);
                
                if (!status.success) {
                    this.handleJobError(jobId, new Error(status.message || 'Status check failed'));
                    return;
                }

                const jobInfo = this.activeJobs.get(jobId);
                if (!jobInfo) return;

                // Update job info
                jobInfo.results = status.results || [];
                jobInfo.completed = status.completed;

                // Trigger progress callback
                if (this.onProgressCallbacks.has(jobId)) {
                    this.onProgressCallbacks.get(jobId)(
                        status.progress, 
                        status.results, 
                        jobId,
                        status.errors
                    );
                }

                if (status.completed) {
                    this.handleJobComplete(jobId, status.results, status.errors);
                }

            } catch (error) {
                console.error(`❌ Polling error for job ${jobId}:`, error);
                this.handleJobError(jobId, error);
            }
        };

        const intervalId = setInterval(pollFunction, interval);
        this.pollingIntervals.set(jobId, intervalId);

        // Set timeout to stop polling after 5 minutes
        setTimeout(() => {
            if (this.pollingIntervals.has(jobId)) {
                console.log(`⏰ Polling timeout for job ${jobId}`);
                this.handleJobError(jobId, new Error('Job processing timeout'));
            }
        }, 5 * 60 * 1000);
    }

    /**
     * Check job status via API
     */
    async checkJobStatus(jobId) {
        const response = await fetch('/api/gemini-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId })
        });

        if (!response.ok) {
            throw new Error(`Status check failed: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Handle job completion
     */
    handleJobComplete(jobId, results, errors = null) {
        console.log(`✅ Job completed: ${jobId}`);
        
        this.stopPolling(jobId);
        
        const jobInfo = this.activeJobs.get(jobId);
        if (jobInfo) {
            jobInfo.completed = true;
            jobInfo.endTime = Date.now();
        }

        // Trigger completion callback
        if (this.onCompleteCallbacks.has(jobId)) {
            this.onCompleteCallbacks.get(jobId)(results, jobId, errors);
        }

        // Cleanup
        this.cleanupJob(jobId);
    }

    /**
     * Handle job errors
     */
    handleJobError(jobId, error) {
        console.error(`❌ Job error: ${jobId}`, error);
        
        this.stopPolling(jobId);

        // Trigger error callback
        if (this.onErrorCallbacks.has(jobId)) {
            this.onErrorCallbacks.get(jobId)(error, jobId);
        }

        // Cleanup
        this.cleanupJob(jobId);
    }

    /**
     * Stop polling for a job
     */
    stopPolling(jobId) {
        if (this.pollingIntervals.has(jobId)) {
            clearInterval(this.pollingIntervals.get(jobId));
            this.pollingIntervals.delete(jobId);
        }
    }

    /**
     * Clean up job resources
     */
    cleanupJob(jobId) {
        this.activeJobs.delete(jobId);
        this.onProgressCallbacks.delete(jobId);
        this.onCompleteCallbacks.delete(jobId);
        this.onErrorCallbacks.delete(jobId);
    }

    /**
     * Prepare files for API transmission
     */
    async prepareFilesForAPI(files) {
        const prepared = [];
        
        for (const fileObj of files) {
            if (fileObj.file && fileObj.file.type === 'application/pdf') {
                try {
                    const arrayBuffer = await fileObj.file.arrayBuffer();
                    const base64Data = this.arrayBufferToBase64(arrayBuffer);
                    
                    prepared.push({
                        name: fileObj.name || fileObj.file.name,
                        mimeType: 'application/pdf',
                        data: base64Data
                    });
                } catch (error) {
                    console.error(`Failed to prepare file ${fileObj.name}:`, error);
                    throw new Error(`File preparation failed: ${fileObj.name}`);
                }
            }
        }
        
        return prepared;
    }

    /**
     * Convert ArrayBuffer to Base64 (chunked to avoid stack overflow)
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
     * Parse Gemini API response
     */
    parseGeminiResponse(text) {
        try {
            const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(cleanText);
        } catch (error) {
            console.error('Failed to parse Gemini response:', error);
            throw new Error('Invalid response format from AI service');
        }
    }

    /**
     * Get active job information
     */
    getJobInfo(jobId) {
        return this.activeJobs.get(jobId);
    }

    /**
     * Get all active jobs
     */
    getActiveJobs() {
        return Array.from(this.activeJobs.values());
    }

    /**
     * Cancel a job
     */
    cancelJob(jobId) {
        console.log(`🚫 Cancelling job: ${jobId}`);
        this.handleJobError(jobId, new Error('Job cancelled by user'));
    }
}

// Export singleton instance
const chunkProcessor = new ChunkProcessor();

// Make available globally
if (typeof window !== 'undefined') {
    window.ChunkProcessor = chunkProcessor;
}

// Export for CommonJS (Node.js testing)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChunkProcessor;
}