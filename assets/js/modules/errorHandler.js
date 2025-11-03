/**
 * Error Handler Module
 * Provides centralized error handling and user-friendly error messages
 */

const ErrorHandler = {
    /**
     * Initialize error handler
     */
    init() {
        // Set up global error handler
        window.addEventListener('error', (event) => {
            this.handleError(event.error, 'Global Error');
        });

        // Set up unhandled promise rejection handler  
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason, 'Unhandled Promise Rejection');
            event.preventDefault(); // Prevent console error
        });

        console.log('✅ ErrorHandler initialized');
    },

    /**
     * Handle and display user-friendly error messages
     * @param {Error|string} error - The error to handle
     * @param {string} context - Context where the error occurred
     * @param {boolean} showToUser - Whether to show the error to the user
     */
    handleError(error, context = 'Unknown', showToUser = true) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const userMessage = this.getUserFriendlyMessage(errorMessage, context);

        // Log detailed error for debugging
        console.error(`[${context}] ${errorMessage}`, error);

        // Show user-friendly message
        if (showToUser && typeof NotificationManager !== 'undefined') {
            NotificationManager.show(userMessage, 'error', 8000);
        }

        // Store error for analytics (optional)
        this.logError(errorMessage, context);

        return userMessage;
    },

    /**
     * Convert technical errors to user-friendly messages
     * @param {string} errorMessage - Technical error message
     * @param {string} context - Error context
     * @returns {string} User-friendly message
     */
    getUserFriendlyMessage(errorMessage, context) {
        // Network errors
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
            return '🌐 網路連線問題，請檢查您的網路連線後重試。';
        }

        // API errors
        if (errorMessage.includes('API key not valid')) {
            return '🔑 API 金鑰無效，請檢查您的 Gemini API 金鑰設定。';
        }

        if (errorMessage.includes('quota')) {
            return '⚠️ API 配額已用完，請檢查您的 Google AI Studio 使用限制。';
        }

        // File handling errors
        if (errorMessage.includes('file') || context.includes('File')) {
            return '📁 檔案處理失敗，請確認檔案格式正確且未損壞。';
        }

        // Storage errors
        if (errorMessage.includes('localStorage') || errorMessage.includes('IndexedDB')) {
            return '💾 本地儲存發生問題，請嘗試清除瀏覽器快取或重新載入頁面。';
        }

        // Parsing errors
        if (errorMessage.includes('JSON') || errorMessage.includes('parse')) {
            return '🔄 資料解析失敗，請檢查檔案格式或重新上傳。';
        }

        // Timeout errors
        if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
            return '⏱️ 操作逾時，請檢查網路連線或重試。';
        }

        // Default message for unknown errors
        return `❌ 發生錯誤：${this.simplifyTechnicalMessage(errorMessage)}`;
    },

    /**
     * Simplify technical error messages
     * @param {string} message - Technical message
     * @returns {string} Simplified message
     */
    simplifyTechnicalMessage(message) {
        // Remove common technical prefixes
        return message
            .replace(/^Error:\s*/i, '')
            .replace(/^TypeError:\s*/i, '')
            .replace(/^ReferenceError:\s*/i, '')
            .replace(/^SyntaxError:\s*/i, '')
            .replace(/at\s+\w+.*$/g, '') // Remove stack trace info
            .trim();
    },

    /**
     * Log errors for debugging and analytics
     * @param {string} errorMessage - Error message
     * @param {string} context - Error context
     */
    logError(errorMessage, context) {
        try {
            const errorLog = {
                timestamp: new Date().toISOString(),
                message: errorMessage,
                context: context,
                userAgent: navigator.userAgent,
                url: window.location.href
            };

            // Store in localStorage for debugging (keep only last 50 errors)
            const errors = JSON.parse(localStorage.getItem('error_log') || '[]');
            errors.push(errorLog);
            
            // Keep only recent errors
            if (errors.length > 50) {
                errors.splice(0, errors.length - 50);
            }
            
            localStorage.setItem('error_log', JSON.stringify(errors));
        } catch (logError) {
            console.warn('Failed to log error:', logError);
        }
    },

    /**
     * Get error logs for debugging
     * @returns {Array} Array of error logs
     */
    getErrorLogs() {
        try {
            return JSON.parse(localStorage.getItem('error_log') || '[]');
        } catch (error) {
            console.warn('Failed to get error logs:', error);
            return [];
        }
    },

    /**
     * Clear error logs
     */
    clearErrorLogs() {
        localStorage.removeItem('error_log');
        console.log('🗑️ Error logs cleared');
    },

    /**
     * Show error summary for debugging
     */
    showErrorSummary() {
        const errors = this.getErrorLogs();
        const summary = {
            totalErrors: errors.length,
            recentErrors: errors.slice(-10),
            commonErrors: this.getCommonErrors(errors)
        };

        console.table(summary.recentErrors);
        console.log('Error Summary:', summary);

        if (typeof NotificationManager !== 'undefined') {
            NotificationManager.show(`發現 ${errors.length} 個錯誤記錄。請查看控制台了解詳細資訊。`, 'info');
        }

        return summary;
    },

    /**
     * Get most common error types
     * @param {Array} errors - Error logs
     * @returns {Object} Common errors count
     */
    getCommonErrors(errors) {
        const errorCounts = {};
        
        errors.forEach(error => {
            const type = error.context || 'Unknown';
            errorCounts[type] = (errorCounts[type] || 0) + 1;
        });

        return Object.entries(errorCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .reduce((obj, [key, value]) => {
                obj[key] = value;
                return obj;
            }, {});
    }
};

// Auto-initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ErrorHandler.init());
} else {
    ErrorHandler.init();
}

// Export for use in other modules
window.ErrorHandler = ErrorHandler;