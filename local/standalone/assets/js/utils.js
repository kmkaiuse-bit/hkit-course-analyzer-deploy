/**
 * Utility Functions - Simplified Local Version
 */

const Utils = {
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

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

    hideProgress() {
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.display = 'none';
        }
    },

    showError(message) {
        alert('Error: ' + message);
    },

    showSuccess(message) {
        alert('Success: ' + message);
    },

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

    getCurrentTimestamp() {
        return new Date().toISOString();
    }
};

window.Utils = Utils;
