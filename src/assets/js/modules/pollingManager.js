/**
 * Polling Manager - Handles progressive result updates with exponential backoff
 * Optimized for Vercel's timeout limitations
 */

class PollingManager {
    constructor() {
        this.activePollers = new Map();
        this.pollingStrategies = {
            immediate: { interval: 1000, maxInterval: 2000, backoffFactor: 1.1 },
            normal: { interval: 2000, maxInterval: 5000, backoffFactor: 1.2 },
            background: { interval: 5000, maxInterval: 15000, backoffFactor: 1.3 }
        };
        this.maxPollingTime = 5 * 60 * 1000; // 5 minutes max
    }

    /**
     * Start polling for a job with progressive backoff
     * @param {string} jobId - Job identifier
     * @param {Object} options - Polling configuration
     */
    startPolling(jobId, options = {}) {
        const {
            strategy = 'normal',
            onProgress = null,
            onComplete = null,
            onError = null,
            maxTime = this.maxPollingTime
        } = options;

        if (this.activePollers.has(jobId)) {
            console.log(`⚠️ Already polling job ${jobId}`);
            return;
        }

        console.log(`🔄 Starting polling for job ${jobId} with strategy: ${strategy}`);

        const config = this.pollingStrategies[strategy] || this.pollingStrategies.normal;
        const startTime = Date.now();

        const pollerState = {
            jobId,
            strategy,
            currentInterval: config.interval,
            maxInterval: config.maxInterval,
            backoffFactor: config.backoffFactor,
            startTime,
            maxTime,
            pollCount: 0,
            lastUpdate: startTime,
            onProgress,
            onComplete,
            onError,
            timeoutId: null,
            intervalId: null
        };

        this.activePollers.set(jobId, pollerState);
        this.scheduleNextPoll(jobId);
        this.setGlobalTimeout(jobId);
    }

    /**
     * Schedule the next poll with backoff
     */
    scheduleNextPoll(jobId) {
        const state = this.activePollers.get(jobId);
        if (!state) return;

        state.timeoutId = setTimeout(async () => {
            await this.performPoll(jobId);
        }, state.currentInterval);
    }

    /**
     * Perform a single poll operation
     */
    async performPoll(jobId) {
        const state = this.activePollers.get(jobId);
        if (!state) return;

        state.pollCount++;
        console.log(`📊 Polling job ${jobId} (attempt ${state.pollCount})`);

        try {
            const status = await this.fetchJobStatus(jobId);
            
            if (status.success) {
                this.handleStatusUpdate(jobId, status);
            } else {
                this.handleError(jobId, new Error(status.message || 'Status fetch failed'));
            }

        } catch (error) {
            console.error(`❌ Poll error for job ${jobId}:`, error);
            this.handleError(jobId, error);
        }
    }

    /**
     * Fetch job status from API
     */
    async fetchJobStatus(jobId) {
        try {
            const response = await fetch('/api/gemini-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            throw new Error(`Failed to fetch status: ${error.message}`);
        }
    }

    /**
     * Handle status update
     */
    handleStatusUpdate(jobId, status) {
        const state = this.activePollers.get(jobId);
        if (!state) return;

        state.lastUpdate = Date.now();

        // Trigger progress callback
        if (state.onProgress) {
            state.onProgress({
                jobId,
                progress: status.progress,
                results: status.results,
                errors: status.errors,
                processingTime: status.processingTime,
                pollCount: state.pollCount
            });
        }

        if (status.completed) {
            this.handleCompletion(jobId, status);
        } else {
            // Apply backoff and schedule next poll
            this.applyBackoff(jobId);
            this.scheduleNextPoll(jobId);
        }
    }

    /**
     * Handle job completion
     */
    handleCompletion(jobId, status) {
        const state = this.activePollers.get(jobId);
        if (!state) return;

        console.log(`✅ Job completed: ${jobId} (${state.pollCount} polls)`);

        if (state.onComplete) {
            state.onComplete({
                jobId,
                results: status.results,
                errors: status.errors,
                totalTime: Date.now() - state.startTime,
                pollCount: state.pollCount
            });
        }

        this.stopPolling(jobId);
    }

    /**
     * Handle polling errors
     */
    handleError(jobId, error) {
        const state = this.activePollers.get(jobId);
        if (!state) return;

        console.error(`❌ Polling error for job ${jobId}:`, error);

        if (state.onError) {
            state.onError({
                jobId,
                error,
                pollCount: state.pollCount,
                totalTime: Date.now() - state.startTime
            });
        }

        this.stopPolling(jobId);
    }

    /**
     * Apply exponential backoff to polling interval
     */
    applyBackoff(jobId) {
        const state = this.activePollers.get(jobId);
        if (!state) return;

        const newInterval = Math.min(
            state.currentInterval * state.backoffFactor,
            state.maxInterval
        );

        state.currentInterval = Math.floor(newInterval);
        
        console.log(`⏱️ Backoff applied for job ${jobId}: ${state.currentInterval}ms`);
    }

    /**
     * Set global timeout for polling
     */
    setGlobalTimeout(jobId) {
        const state = this.activePollers.get(jobId);
        if (!state) return;

        setTimeout(() => {
            if (this.activePollers.has(jobId)) {
                console.log(`⏰ Global timeout for job ${jobId}`);
                this.handleError(jobId, new Error('Polling timeout exceeded'));
            }
        }, state.maxTime);
    }

    /**
     * Stop polling for a specific job
     */
    stopPolling(jobId) {
        const state = this.activePollers.get(jobId);
        if (!state) return;

        console.log(`🛑 Stopping polling for job ${jobId}`);

        if (state.timeoutId) {
            clearTimeout(state.timeoutId);
        }
        if (state.intervalId) {
            clearInterval(state.intervalId);
        }

        this.activePollers.delete(jobId);
    }

    /**
     * Stop all active polling
     */
    stopAll() {
        console.log('🛑 Stopping all polling operations');
        
        for (const jobId of this.activePollers.keys()) {
            this.stopPolling(jobId);
        }
    }

    /**
     * Get polling statistics
     */
    getPollingStats(jobId) {
        const state = this.activePollers.get(jobId);
        if (!state) return null;

        const currentTime = Date.now();
        return {
            jobId,
            strategy: state.strategy,
            currentInterval: state.currentInterval,
            pollCount: state.pollCount,
            totalTime: currentTime - state.startTime,
            timeSinceLastUpdate: currentTime - state.lastUpdate,
            isActive: true
        };
    }

    /**
     * Get all active polling operations
     */
    getActivePollingStats() {
        return Array.from(this.activePollers.keys()).map(jobId => 
            this.getPollingStats(jobId)
        );
    }

    /**
     * Update polling strategy for an active job
     */
    updateStrategy(jobId, newStrategy) {
        const state = this.activePollers.get(jobId);
        if (!state) return false;

        const config = this.pollingStrategies[newStrategy];
        if (!config) return false;

        console.log(`🔄 Updating polling strategy for job ${jobId}: ${state.strategy} → ${newStrategy}`);

        state.strategy = newStrategy;
        state.currentInterval = config.interval;
        state.maxInterval = config.maxInterval;
        state.backoffFactor = config.backoffFactor;

        return true;
    }

    /**
     * Pause polling for a job
     */
    pausePolling(jobId) {
        const state = this.activePollers.get(jobId);
        if (!state) return false;

        console.log(`⏸️ Pausing polling for job ${jobId}`);

        if (state.timeoutId) {
            clearTimeout(state.timeoutId);
            state.timeoutId = null;
        }

        state.paused = true;
        return true;
    }

    /**
     * Resume polling for a job
     */
    resumePolling(jobId) {
        const state = this.activePollers.get(jobId);
        if (!state || !state.paused) return false;

        console.log(`▶️ Resuming polling for job ${jobId}`);

        state.paused = false;
        this.scheduleNextPoll(jobId);
        return true;
    }

    /**
     * Check if a job is being polled
     */
    isPolling(jobId) {
        return this.activePollers.has(jobId);
    }

    /**
     * Get count of active pollers
     */
    getActiveCount() {
        return this.activePollers.size;
    }
}

// Export singleton instance
const pollingManager = new PollingManager();

// Make available globally
if (typeof window !== 'undefined') {
    window.PollingManager = pollingManager;
}

// Export for CommonJS (Node.js testing)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PollingManager;
}