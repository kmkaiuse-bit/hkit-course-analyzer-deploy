/**
 * API Configuration - Enhanced Version
 * Supports both Vercel Functions and Local Mode
 */

const API_CONFIG = {
    // Default to production mode (can be overridden by LOCAL_MODE flag)
    LOCAL_MODE: false,
    
    // Vercel Function endpoints
    functions: {
        gemini: '/api/gemini',
        geminiChunked: '/api/gemini-chunked',
        geminiStatus: '/api/gemini-status'
    },

    // Direct Gemini API settings for local mode
    gemini: {
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
        model: 'gemini-1.5-pro',
        timeout: 60000
    },
    
    // Request Settings
    timeout: 30000,
    retries: 2,
    
    // Get API key from localStorage or window override (for local mode)
    getApiKey: () => {
        if (window.API_CONFIG && window.API_CONFIG.getApiKey) {
            return window.API_CONFIG.getApiKey();
        }
        return localStorage.getItem('gemini_api_key') || '';
    },
    
    // Validate configuration
    validate: function() {
        if (this.LOCAL_MODE) {
            const apiKey = this.getApiKey();
            if (!apiKey || !apiKey.startsWith('AIza')) {
                throw new Error('Gemini API key is not properly configured. Please enter your API key.');
            }
        }
        return true;
    }
};

/**
 * 调用Gemini API（通过Vercel Function）
 * @param {string} prompt - 分析提示
 * @returns {Promise} API响应
 */
async function callGeminiAPI(prompt) {
    try {
        const response = await fetch(API_CONFIG.functions.gemini, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                model: 'gemini-1.5-pro'
            })
        });

        if (!response.ok) {
            throw new Error(`API call failed: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
}

/**
 * 验证API配置（现在总是返回true，因为无需前端密钥）
 * @returns {boolean} True if configuration is valid
 */
function validateConfig() {
    return true; // Vercel Functions处理验证
}

// 向后兼容的函数
function getGeminiEndpoint() {
    return API_CONFIG.functions.gemini;
}
