/**
 * API Configuration - PRODUCTION ENVIRONMENT
 * 
 * ⚠️ ENVIRONMENT: PRODUCTION ONLY
 * This configuration is used for the production deployment on Vercel
 * 
 * FEATURES:
 * - Uses Gemini API via Vercel serverless functions
 * - All API keys are server-side (secure)
 * - No client-side API key exposure
 * - Backend-only mode (recommended for production)
 * 
 * DEPLOYMENT:
 * - Set GEMINI_API_KEY in Vercel Dashboard environment variables
 * - Deploy via: vercel --prod
 * - This config is loaded by index.html (production entry point)
 */

const API_CONFIG = {
    // Production mode - always use Vercel Functions
    LOCAL_MODE: false,
    ENVIRONMENT: 'production',
    API_PROVIDER: 'gemini',
    
    // Vercel Function endpoints (serverless)
    functions: {
        gemini: '/api/gemini',
        geminiChunked: '/api/gemini-chunked',
        geminiStatus: '/api/gemini-status'
    },

    // Gemini model configuration
    gemini: {
        model: 'gemini-2.0-flash-exp',
        temperature: 0.7,
        maxTokens: 16384,
        timeout: 60000
    },
    
    // Request settings
    timeout: 30000,
    retries: 2,
    
    // API key getter (not used in production - keys are server-side)
    getApiKey: () => {
        console.warn('⚠️ Production mode: API keys are server-side only');
        return null; // No client-side keys in production
    },
    
    // Validate configuration
    validate: function() {
        if (this.LOCAL_MODE) {
            console.error('❌ Production config should not be in LOCAL_MODE');
            return false;
        }
        console.log('✅ Production config validated: Using Vercel Functions');
        return true;
    }
};

/**
 * Call Gemini API via Vercel Function (Production)
 * @param {string} prompt - Analysis prompt
 * @param {Object} options - Additional options
 * @returns {Promise} API response
 */
async function callGeminiAPI(prompt, options = {}) {
    try {
        console.log('🚀 Production: Calling Gemini via Vercel Function');
        
        const response = await fetch(API_CONFIG.functions.gemini, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                model: options.model || API_CONFIG.gemini.model,
                temperature: options.temperature || API_CONFIG.gemini.temperature,
                maxTokens: options.maxTokens || API_CONFIG.gemini.maxTokens,
                files: options.files || []
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `API call failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Production: API call successful');
        return data;
        
    } catch (error) {
        console.error('❌ Production API call error:', error);
        throw error;
    }
}

/**
 * Validate API configuration (Production)
 * @returns {boolean} True if configuration is valid
 */
function validateConfig() {
    return API_CONFIG.validate();
}

/**
 * Get Gemini endpoint (backward compatibility)
 * @returns {string} API endpoint
 */
function getGeminiEndpoint() {
    return API_CONFIG.functions.gemini;
}

// Log configuration on load
console.log('📦 Loaded: Production API Configuration (Gemini via Vercel Functions)');

