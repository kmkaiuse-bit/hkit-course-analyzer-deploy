/**
 * API Configuration Template
 * Copy this file and add your actual API key
 */

const API_CONFIG = {
    // Gemini API Settings
    gemini: {
        apiKey: '', // IMPORTANT: Add your Gemini API key here
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        model: 'gemini-1.5-pro', // Stable model
        maxTokens: 8192,
        temperature: 0.3 // lower temperature for consistent analysis
    },

    // Request Settings
    timeout: 30000, // 30 seconds timeout
    retries: 2
};

/**
 * Get API endpoint URL
 * @returns {string} Complete API endpoint
 */
function getGeminiEndpoint() {
    return `${API_CONFIG.gemini.baseUrl}/models/${API_CONFIG.gemini.model}:generateContent?key=${API_CONFIG.gemini.apiKey}`;
}

/**
 * Validate API configuration
 * @returns {boolean} True if configuration is valid
 */
function validateConfig() {
    return API_CONFIG.gemini.apiKey && API_CONFIG.gemini.apiKey.length > 0;
}
