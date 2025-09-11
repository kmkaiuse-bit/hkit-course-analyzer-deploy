/**
 * Utility Functions
 * Helper functions for common tasks
 */

const Utils = {
    /**
     * Format file size in human readable format
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Show progress bar with percentage and message
     * @param {number} percentage - Progress percentage (0-100)
     * @param {string} message - Optional progress message
     */
    showProgress(percentage, message = '') {
        const progressBar = document.getElementById('progressBar');
        const progressFill = document.getElementById('progressFill');
        const statusMessage = document.getElementById('statusMessage');
        
        if (progressBar) {
            progressBar.style.display = 'block';
            progressFill.style.width = percentage + '%';
            
            if (statusMessage && message) {
                statusMessage.textContent = message;
            }
        }
    },

    /**
     * Hide progress bar
     */
    hideProgress() {
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.display = 'none';
        }
    },

    /**
     * Show loading state
     * @param {string} elementId - Element to show loading in
     * @param {string} message - Loading message
     */
    showLoading(elementId, message = 'Processing...') {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <span>${message}</span>
                </div>
            `;
        }
    },

    /**
     * Show error message
     * @param {string} message - Error message
     * @param {string} elementId - Optional element ID to show error in
     */
    showError(message, elementId = null) {
        if (elementId) {
            const element = document.getElementById(elementId);
            if (element) {
                element.innerHTML = `<div class="error-message">❌ ${message}</div>`;
            }
        } else {
            alert('Error: ' + message);
        }
    },

    /**
     * Show success message
     * @param {string} message - Success message
     * @param {string} elementId - Optional element ID to show message in
     */
    showSuccess(message, elementId = null) {
        if (elementId) {
            const element = document.getElementById(elementId);
            if (element) {
                element.innerHTML = `<div class="success-message">✅ ${message}</div>`;
            }
        }
    },

    /**
     * Read file content as text
     * @param {File} file - File object to read
     * @returns {Promise<string>} File content as string
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    },

    /**
     * Download content as file
     * @param {string} content - File content
     * @param {string} filename - Filename
     * @param {string} mimeType - MIME type
     */
    downloadFile(content, filename, mimeType = 'text/plain') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Debounce function calls
     * @param {Function} func - Function to debounce
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },

    /**
     * Deep clone an object
     * @param {Object} obj - Object to clone
     * @returns {Object} Cloned object
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * Get current timestamp in ISO format
     * @returns {string} ISO timestamp
     */
    getCurrentTimestamp() {
        return new Date().toISOString();
    },

    /**
     * Generate random ID
     * @param {number} length - ID length
     * @returns {string} Random ID
     */
    generateId(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    /**
     * Sleep/delay execution
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise} Promise that resolves after delay
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
