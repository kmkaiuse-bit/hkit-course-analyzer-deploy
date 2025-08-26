/**
 * Local API Configuration - Enhanced Version
 * Direct Gemini API integration for local deployment
 * 
 * Features:
 * - User-friendly API key management
 * - Validation and error handling
 * - Configurable settings
 * - Rate limiting awareness
 */

class LocalAPIConfig {
    constructor() {
        this.apiKey = null;
        this.isValidated = false;
        this.settings = {
            model: 'gemini-2.5-pro',
            baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
            timeout: 60000,
            retries: 2,
            temperature: 0.7,
            maxTokens: 8192
        };
        
        // Load saved API key on initialization
        this.loadSavedConfig();
    }

    /**
     * Set and validate API key
     * @param {string} apiKey - Gemini API key
     * @returns {Promise<boolean>} Validation result
     */
    async setApiKey(apiKey) {
        if (!apiKey || typeof apiKey !== 'string') {
            throw new Error('Invalid API key format');
        }

        if (!apiKey.startsWith('AIza')) {
            throw new Error('Gemini API key should start with "AIza"');
        }

        this.apiKey = apiKey;
        
        // Validate the key by making a test call
        try {
            await this.validateApiKey();
            this.saveConfig();
            return true;
        } catch (error) {
            this.apiKey = null;
            this.isValidated = false;
            throw new Error(`API key validation failed: ${error.message}`);
        }
    }

    /**
     * Validate API key with test call
     * @returns {Promise<void>}
     */
    async validateApiKey() {
        if (!this.apiKey) {
            throw new Error('No API key provided');
        }

        const testEndpoint = `${this.settings.baseUrl}/models/${this.settings.model}:generateContent`;
        
        try {
            const response = await fetch(`${testEndpoint}?key=${this.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: 'test' }] }],
                    generationConfig: { maxOutputTokens: 10 }
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || `HTTP ${response.status}`);
            }

            this.isValidated = true;
            console.log('✅ API key validated successfully');
        } catch (error) {
            this.isValidated = false;
            console.error('❌ API key validation failed:', error);
            throw error;
        }
    }

    /**
     * Get complete API endpoint URL
     * @returns {string} Full endpoint URL
     */
    getEndpoint() {
        return `${this.settings.baseUrl}/models/${this.settings.model}:generateContent`;
    }

    /**
     * Make API call to Gemini
     * @param {string} prompt - Text prompt
     * @param {Array} files - Optional file array for multimodal input
     * @returns {Promise<Object>} API response
     */
    async callGeminiAPI(prompt, files = []) {
        if (!this.isValidated) {
            throw new Error('API key not validated. Please configure your API key first.');
        }

        const requestBody = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: this.settings.temperature,
                maxOutputTokens: this.settings.maxTokens,
                topP: 0.95,
                topK: 40
            }
        };

        // Add files for multimodal input if provided
        if (files && files.length > 0) {
            files.forEach(file => {
                if (file.mimeType === 'application/pdf') {
                    requestBody.contents[0].parts.push({
                        inlineData: {
                            mimeType: file.mimeType,
                            data: file.data
                        }
                    });
                }
            });
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.settings.timeout);

        try {
            const response = await fetch(`${this.getEndpoint()}?key=${this.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || `HTTP ${response.status}`);
            }

            const data = await response.json();
            
            // Debug: Log the full response
            console.log('Full API Response:', JSON.stringify(data, null, 2));
            
            // Check if response has the expected structure
            if (data.candidates && data.candidates[0]) {
                const candidate = data.candidates[0];
                
                // Handle different finish reasons
                if (candidate.finishReason === 'STOP' && candidate.content && candidate.content.parts && candidate.content.parts[0]) {
                    // Normal successful response
                    return {
                        success: true,
                        data: {
                            text: candidate.content.parts[0].text
                        }
                    };
                } else if (candidate.finishReason === 'SAFETY') {
                    throw new Error('Content was blocked by safety filters. Please try with different transcript content.');
                } else if (candidate.finishReason === 'RECITATION') {
                    throw new Error('Content was flagged as potential recitation. Please try with original transcript content.');
                } else if (candidate.finishReason === 'MAX_TOKENS') {
                    throw new Error('Response was too long. Please try with smaller transcript files.');
                } else {
                    console.log('Candidate object:', candidate);
                    throw new Error(`API finished with reason: ${candidate.finishReason}. Check console for details.`);
                }
            } else {
                // No candidates in response
                console.error('No candidates in API response:', data);
                if (data.error) {
                    throw new Error(`API Error: ${data.error.message}`);
                }
                throw new Error('API returned no results. Please try again.');
            }

        } catch (error) {
            clearTimeout(timeoutId);
            console.error('Gemini API Error:', error);
            
            // Provide more helpful error messages
            if (error.message.includes('Invalid API response format')) {
                throw new Error('API returned unexpected response. This might be due to content filtering or API quota limits.');
            } else if (error.message.includes('quota')) {
                throw new Error('API quota exceeded. Please check your API usage limits.');
            } else if (error.message.includes('SAFETY')) {
                throw new Error('Content was blocked by safety filters. Try with different input.');
            } else if (error.message.includes('timeout')) {
                throw new Error('Request timed out. Please try again with smaller files.');
            }
            
            throw error;
        }
    }

    /**
     * Save configuration to localStorage
     */
    saveConfig() {
        if (this.apiKey && this.isValidated) {
            localStorage.setItem('hkit_gemini_api_key', this.apiKey);
            localStorage.setItem('hkit_api_config', JSON.stringify({
                isValidated: this.isValidated,
                settings: this.settings,
                lastValidated: new Date().toISOString()
            }));
        }
    }

    /**
     * Load saved configuration from localStorage
     */
    loadSavedConfig() {
        try {
            const savedKey = localStorage.getItem('hkit_gemini_api_key');
            const savedConfig = localStorage.getItem('hkit_api_config');

            if (savedKey && savedConfig) {
                this.apiKey = savedKey;
                const config = JSON.parse(savedConfig);
                this.isValidated = config.isValidated;
                this.settings = { ...this.settings, ...config.settings };
                
                console.log('✅ Loaded saved API configuration');
            }
        } catch (error) {
            console.warn('Could not load saved configuration:', error);
            this.clearSavedConfig();
        }
    }

    /**
     * Clear saved configuration
     */
    clearSavedConfig() {
        localStorage.removeItem('hkit_gemini_api_key');
        localStorage.removeItem('hkit_api_config');
        this.apiKey = null;
        this.isValidated = false;
    }

    /**
     * Get configuration status for UI
     * @returns {Object} Status object
     */
    getStatus() {
        return {
            hasApiKey: !!this.apiKey,
            isValidated: this.isValidated,
            model: this.settings.model,
            canMakeRequests: this.apiKey && this.isValidated
        };
    }

    /**
     * Update settings
     * @param {Object} newSettings - Settings to update
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveConfig();
    }
}

// Create global instance
const API_CONFIG = new LocalAPIConfig();

// Backward compatibility function
window.callGeminiAPI = async (prompt, files = []) => {
    return await API_CONFIG.callGeminiAPI(prompt, files);
};

// Export for use in modules
window.API_CONFIG = API_CONFIG;

// Initialize status check on load
document.addEventListener('DOMContentLoaded', () => {
    const status = API_CONFIG.getStatus();
    
    if (!status.canMakeRequests) {
        console.warn('⚠️ Gemini API not configured. Please set up your API key.');
        showAPIConfigurationPanel();
    } else {
        console.log('✅ Local API ready for use');
    }
});

/**
 * Show API configuration panel
 */
function showAPIConfigurationPanel() {
    // Create configuration modal if it doesn't exist
    if (document.getElementById('apiConfigModal')) return;

    const modal = document.createElement('div');
    modal.id = 'apiConfigModal';
    modal.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-content">
                <h3>🔑 Configure Gemini API Key</h3>
                <p>Enter your Google Gemini API key to use the local analyzer:</p>
                
                <div class="form-group">
                    <label for="apiKeyInput">API Key:</label>
                    <input type="password" id="apiKeyInput" placeholder="AIzaSy..." class="api-input">
                    <button type="button" id="toggleApiKey" class="toggle-btn">👁️</button>
                </div>
                
                <div class="form-actions">
                    <button id="validateApiKey" class="btn btn-primary">Validate & Save</button>
                    <button id="getApiKeyLink" class="btn btn-secondary">Get API Key</button>
                </div>
                
                <div id="apiKeyStatus"></div>
                
                <div class="help-text">
                    <p><strong>How to get a free API key:</strong></p>
                    <ol>
                        <li>Visit <a href="https://makersuite.google.com/app/apikey" target="_blank">Google AI Studio</a></li>
                        <li>Sign in with your Google account</li>
                        <li>Click "Create API Key"</li>
                        <li>Copy the generated key and paste it above</li>
                    </ol>
                </div>
            </div>
        </div>
    `;

    // Add styles
    modal.innerHTML += `
        <style>
            .modal-overlay {
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.8); z-index: 10000;
                display: flex; align-items: center; justify-content: center;
            }
            .modal-content {
                background: white; padding: 30px; border-radius: 12px;
                max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;
            }
            .form-group {
                margin: 20px 0; position: relative;
            }
            .api-input {
                width: 100%; padding: 12px; border: 2px solid #ddd;
                border-radius: 8px; font-family: monospace;
            }
            .toggle-btn {
                position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
                background: none; border: none; cursor: pointer;
            }
            .form-actions {
                display: flex; gap: 10px; margin: 20px 0;
            }
            .btn {
                padding: 12px 20px; border-radius: 8px; border: none;
                cursor: pointer; font-weight: bold;
            }
            .btn-primary { background: #4CAF50; color: white; }
            .btn-secondary { background: #2196F3; color: white; }
            .help-text {
                margin-top: 20px; padding: 15px; background: #f5f5f5;
                border-radius: 8px; font-size: 14px;
            }
        </style>
    `;

    document.body.appendChild(modal);

    // Event handlers
    const apiKeyInput = document.getElementById('apiKeyInput');
    const toggleBtn = document.getElementById('toggleApiKey');
    const validateBtn = document.getElementById('validateApiKey');
    const getKeyBtn = document.getElementById('getApiKeyLink');
    const statusDiv = document.getElementById('apiKeyStatus');

    // Toggle password visibility
    toggleBtn.addEventListener('click', () => {
        const isPassword = apiKeyInput.type === 'password';
        apiKeyInput.type = isPassword ? 'text' : 'password';
        toggleBtn.textContent = isPassword ? '🙈' : '👁️';
    });

    // Validate API key
    validateBtn.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            statusDiv.innerHTML = '<div class="error">❌ Please enter an API key</div>';
            return;
        }

        validateBtn.textContent = 'Validating...';
        validateBtn.disabled = true;

        try {
            await API_CONFIG.setApiKey(apiKey);
            statusDiv.innerHTML = '<div class="success">✅ API key validated and saved!</div>';
            
            setTimeout(() => {
                modal.remove();
                location.reload(); // Refresh to activate the configuration
            }, 1500);
            
        } catch (error) {
            statusDiv.innerHTML = `<div class="error">❌ ${error.message}</div>`;
            validateBtn.textContent = 'Validate & Save';
            validateBtn.disabled = false;
        }
    });

    // Get API key link
    getKeyBtn.addEventListener('click', () => {
        window.open('https://makersuite.google.com/app/apikey', '_blank');
    });

    // Load existing key if available
    if (API_CONFIG.apiKey) {
        apiKeyInput.value = API_CONFIG.apiKey;
    }
}
