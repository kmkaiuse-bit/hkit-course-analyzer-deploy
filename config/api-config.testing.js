/**
 * API Configuration - TESTING ENVIRONMENT
 * 
 * ⚠️ ENVIRONMENT: TESTING/LOCAL DEVELOPMENT ONLY
 * This configuration is for OpenRouter testing and experimentation
 * 
 * FEATURES:
 * - Uses OpenRouter API for testing
 * - Can use client-side API keys (for local testing)
 * - Supports both backend and frontend modes
 * - Isolated from production environment
 * 
 * USAGE:
 * - Load this config in local/enhanced.html
 * - Set OPENROUTER_API_KEY in .env.local or client-api-config.js
 * - This is NOT deployed to production
 */

const API_CONFIG = {
    // Testing mode - can use local mode or backend
    LOCAL_MODE: true, // Can be overridden by backend detection
    ENVIRONMENT: 'testing',
    API_PROVIDER: 'openrouter',
    
    // Backend endpoints (if using local learning server)
    backend: {
        baseUrl: 'http://localhost:3001',
        endpoints: {
            gemini: '/api/gemini/analyze',
            status: '/api/gemini/status',
            health: '/api/health'
        }
    },

    // OpenRouter configuration (testing)
    openrouter: {
        baseUrl: 'https://openrouter.ai/api/v1',
        model: 'google/gemini-2.5-pro',
        temperature: 0.3,
        maxTokens: 16384,
        timeout: 60000
    },
    
    // Gemini configuration (for reference/fallback)
    gemini: {
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
        model: 'gemini-2.0-flash-exp',
        temperature: 0.7,
        maxTokens: 16384,
        timeout: 60000
    },
    
    // Request settings
    timeout: 60000, // Longer timeout for testing
    retries: 3,
    
    // Get API key from client config or localStorage
    getApiKey: () => {
        // Try client config first (for testing)
        if (window.CLIENT_API_CONFIG && window.CLIENT_API_CONFIG.OPENROUTER_API_KEY) {
            return window.CLIENT_API_CONFIG.OPENROUTER_API_KEY;
        }
        
        // Fallback to localStorage
        return localStorage.getItem('openrouter_api_key') || '';
    },
    
    // Get Gemini key (for fallback)
    getGeminiKey: () => {
        if (window.CLIENT_API_CONFIG && window.CLIENT_API_CONFIG.GEMINI_API_KEY) {
            return window.CLIENT_API_CONFIG.GEMINI_API_KEY;
        }
        return localStorage.getItem('gemini_api_key') || '';
    },
    
    // Detect if backend is available
    detectBackend: async function() {
        try {
            const response = await fetch(this.backend.baseUrl + this.backend.endpoints.health, {
                method: 'GET',
                timeout: 2000
            });
            return response.ok;
        } catch (error) {
            console.log('🔌 Backend not available, using frontend mode');
            return false;
        }
    },
    
    // Validate configuration
    validate: function() {
        const apiKey = this.getApiKey();
        if (!apiKey || apiKey === 'YOUR_OPENROUTER_API_KEY_HERE') {
            console.warn('⚠️ Testing mode: OpenRouter API key not configured');
            console.warn('Set OPENROUTER_API_KEY in client-api-config.js or .env.local');
            return false;
        }
        console.log('✅ Testing config validated: Using OpenRouter');
        return true;
    }
};

/**
 * Call OpenRouter API (Testing)
 * @param {string} prompt - Analysis prompt
 * @param {Object} options - Additional options
 * @returns {Promise} API response
 */
async function callGeminiAPI(prompt, options = {}) {
    try {
        console.log('🧪 Testing: Calling OpenRouter API');
        
        // Check if backend is available
        const hasBackend = await API_CONFIG.detectBackend();
        
        if (hasBackend) {
            // Use backend server
            console.log('🔌 Using backend server (localhost:3001)');
            return await callBackendAPI(prompt, options);
        } else {
            // Use direct OpenRouter call
            console.log('🌐 Using direct OpenRouter API call');
            return await callOpenRouterDirect(prompt, options);
        }
        
    } catch (error) {
        console.error('❌ Testing API call error:', error);
        throw error;
    }
}

/**
 * Call backend server (if available)
 */
async function callBackendAPI(prompt, options = {}) {
    const response = await fetch(
        API_CONFIG.backend.baseUrl + API_CONFIG.backend.endpoints.gemini,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                model: options.model || API_CONFIG.openrouter.model,
                temperature: options.temperature || API_CONFIG.openrouter.temperature,
                maxTokens: options.maxTokens || API_CONFIG.openrouter.maxTokens,
                files: options.files || []
            })
        }
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Backend call failed: ${response.status}`);
    }

    return await response.json();
}

/**
 * Call OpenRouter directly (frontend mode)
 */
async function callOpenRouterDirect(prompt, options = {}) {
    const apiKey = API_CONFIG.getApiKey();
    if (!apiKey) {
        throw new Error('OpenRouter API key not configured');
    }

    // Build messages
    const messages = [
        { role: 'user', content: [{ type: 'text', text: prompt }] }
    ];

    // Add files if present
    if (options.files && options.files.length > 0) {
        options.files.forEach(f => {
            if (f.mimeType && f.data) {
                messages[0].content.push({
                    type: 'image_url',
                    image_url: { url: `data:${f.mimeType};base64,${f.data}` }
                });
            }
        });
    }

    const response = await fetch(API_CONFIG.openrouter.baseUrl + '/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'HKIT Course Analyzer (Testing)'
        },
        body: JSON.stringify({
            model: options.model || API_CONFIG.openrouter.model,
            messages: messages,
            temperature: options.temperature || API_CONFIG.openrouter.temperature,
            max_tokens: options.maxTokens || API_CONFIG.openrouter.maxTokens
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `OpenRouter Error: ${response.status}`);
    }

    const data = await response.json();
    
    // Convert OpenRouter response to our format
    return {
        success: true,
        data: {
            text: data.choices[0].message.content
        }
    };
}

/**
 * Validate API configuration (Testing)
 * @returns {boolean} True if configuration is valid
 */
function validateConfig() {
    return API_CONFIG.validate();
}

/**
 * Get API endpoint (backward compatibility)
 * @returns {string} API endpoint
 */
function getGeminiEndpoint() {
    return API_CONFIG.backend.baseUrl + API_CONFIG.backend.endpoints.gemini;
}

// Log configuration on load
console.log('🧪 Loaded: Testing API Configuration (OpenRouter)');

