/**
 * Smart API Configuration Manager
 * Automatically detects and switches between backend and frontend API modes
 * Provides seamless fallback and intelligent mode selection
 *
 * ENVIRONMENT DETECTION:
 * - Production: Uses Gemini API via Vercel Functions (server-side keys)
 * - Testing: Uses OpenRouter API for experimentation (local only)
 *
 * Auto-detects environment based on:
 * 1. URL hostname (production domain vs localhost)
 * 2. Available config files (production vs testing)
 * 3. Backend server availability
 *
 * Related Documentation:
 * - ENVIRONMENT_SETUP.md - Complete environment setup guide
 * - ENVIRONMENT_SEPARATION_PLAN.md - Environment architecture
 */

class SmartAPIConfig {
    constructor() {
        this.mode = null; // 'backend' or 'frontend'
        this.environment = null; // 'production' or 'testing'
        this.apiProvider = null; // 'gemini' or 'openrouter'
        this.backendAvailable = false;
        this.frontendKeyAvailable = false;
        this.serverUrl = 'http://localhost:3001';
        this.initialized = false;

        // Configuration cache
        this.config = {
            gemini: {
                baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
                model: 'gemini-1.5-flash',
                temperature: 0.7,
                maxTokens: 8192,
                timeout: 60000
            },
            backend: {
                baseUrl: 'http://localhost:3001',
                endpoints: {
                    analyze: '/api/gemini/analyze',
                    validate: '/api/gemini/validate',
                    health: '/api/health',
                    status: '/api/gemini/status'
                }
            }
        };

        // Usage tracking
        this.usage = {
            requests: 0,
            errors: 0,
            lastRequest: null,
            totalTokens: 0
        };
    }

    /**
     * Detect environment (production vs testing)
     * Based on URL, config files, and context
     */
    detectEnvironment() {
        const hostname = window.location.hostname;
        const pathname = window.location.pathname;

        // Check if running in production (Vercel deployment)
        if (hostname.includes('vercel.app') || hostname.includes('hkit-course-analyzer')) {
            this.environment = 'production';
            this.apiProvider = 'gemini';
            console.log('🌍 Environment: PRODUCTION (Vercel)');
            console.log('   Provider: Gemini API via Vercel Functions');
            return;
        }

        // Check if local/enhanced.html (testing environment)
        if (pathname.includes('local/enhanced.html') || pathname.includes('enhanced')) {
            this.environment = 'testing';
            this.apiProvider = 'openrouter'; // Default, can be overridden
            console.log('🧪 Environment: TESTING (Local Development)');
            console.log('   Provider: OpenRouter API (experimental)');
            console.log('   ⚠️ Testing environment - not for production use');
            return;
        }

        // Check if production index.html
        if (pathname.includes('index.html') || pathname === '/' || hostname === 'localhost') {
            this.environment = 'production';
            this.apiProvider = 'gemini';
            console.log('🌍 Environment: PRODUCTION (Local Test)');
            console.log('   Provider: Gemini API');
            console.log('   ℹ️ Testing production configuration locally');
            return;
        }

        // Default to testing for safety
        this.environment = 'testing';
        this.apiProvider = 'gemini';
        console.log('⚠️ Environment: Unknown - Defaulting to TESTING');
        console.log('   Provider: Gemini API (safe default)');
    }

    /**
     * Validate environment configuration
     * Warns if config doesn't match expected environment
     */
    validateEnvironmentConfig() {
        // Check if API_CONFIG is defined (from loaded config file)
        if (typeof API_CONFIG !== 'undefined') {
            const loadedEnv = API_CONFIG.ENVIRONMENT || 'unknown';
            const loadedProvider = API_CONFIG.API_PROVIDER || 'unknown';

            if (loadedEnv !== this.environment) {
                console.warn(`⚠️ CONFIG MISMATCH: Detected ${this.environment} environment but loaded ${loadedEnv} config`);
                console.warn(`   This may cause unexpected behavior`);
                console.warn(`   Expected config: api-config.${this.environment}.js`);
            }

            if (loadedProvider !== this.apiProvider) {
                console.warn(`⚠️ PROVIDER MISMATCH: Expected ${this.apiProvider} but loaded config uses ${loadedProvider}`);
            }
        }

        // Safety check for production environment
        if (this.environment === 'production' && this.apiProvider !== 'gemini') {
            console.error('🚨 CRITICAL: Production environment must use Gemini API');
            console.error('   OpenRouter should NEVER be used in production');
            console.error('   Please check your configuration files');
        }
    }

    /**
     * Initialize and auto-detect best API mode
     */
    async initialize() {
        console.log('═══════════════════════════════════════════════════════');
        console.log('🔍 Smart API Config: Starting initialization...');
        console.log('═══════════════════════════════════════════════════════');

        try {
            // Step 0: Detect environment FIRST
            this.detectEnvironment();

            // Step 1: Validate environment configuration
            this.validateEnvironmentConfig();

            // Step 2: Check if backend server is available
            await this.checkBackendAvailability();

            // Step 3: Check if frontend API key is available
            this.checkFrontendKeyAvailability();

            // Step 4: Determine best mode
            this.selectOptimalMode();

            this.initialized = true;

            console.log('═══════════════════════════════════════════════════════');
            console.log(`✅ Smart API Config: Initialized Successfully`);
            console.log(`   Environment: ${this.environment.toUpperCase()}`);
            console.log(`   API Provider: ${this.apiProvider}`);
            console.log(`   Mode: ${this.mode}`);
            console.log(`   Backend Available: ${this.backendAvailable}`);
            console.log(`   Frontend Key Available: ${this.frontendKeyAvailable}`);
            console.log('═══════════════════════════════════════════════════════');

            // Update UI
            this.updateUIIndicator();

            return {
                success: true,
                environment: this.environment,
                apiProvider: this.apiProvider,
                mode: this.mode,
                backendAvailable: this.backendAvailable,
                frontendKeyAvailable: this.frontendKeyAvailable
            };

        } catch (error) {
            console.error('═══════════════════════════════════════════════════════');
            console.error('❌ Smart API Config: Initialization failed', error);
            console.error('═══════════════════════════════════════════════════════');

            this.mode = 'frontend'; // Safe fallback
            this.initialized = true;

            return {
                success: false,
                mode: this.mode,
                error: error.message
            };
        }
    }

    /**
     * Check if backend server is available and has API key configured
     */
    async checkBackendAvailability() {
        try {
            const response = await fetch(`${this.config.backend.baseUrl}/api/gemini/status`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(3000) // 3 second timeout
            });

            if (response.ok) {
                const data = await response.json();
                this.backendAvailable = data.apiKeyConfigured === true;

                if (this.backendAvailable) {
                    console.log('✅ Backend server available with API key configured');
                } else {
                    console.log('⚠️ Backend server available but API key not configured');
                }
            } else {
                this.backendAvailable = false;
                console.log('⚠️ Backend server returned error');
            }
        } catch (error) {
            this.backendAvailable = false;
            console.log('ℹ️ Backend server not available (normal for frontend-only mode)');
        }
    }

    /**
     * Check if frontend API key is available in localStorage
     */
    checkFrontendKeyAvailability() {
        const apiKey = localStorage.getItem('gemini_api_key');
        this.frontendKeyAvailable = !!(apiKey && apiKey.startsWith('AIza') && apiKey.length >= 30);

        if (this.frontendKeyAvailable) {
            console.log('✅ Frontend API key available in localStorage');
        } else {
            console.log('ℹ️ No frontend API key configured');
        }
    }

    /**
     * Select optimal mode based on availability
     */
    selectOptimalMode() {
        // Priority: Backend > Frontend
        if (this.backendAvailable) {
            this.mode = 'backend';
            console.log('📍 Selected backend mode (API key on server)');
        } else if (this.frontendKeyAvailable) {
            this.mode = 'frontend';
            console.log('📍 Selected frontend mode (user API key)');
        } else {
            this.mode = 'frontend'; // Default, will prompt user for key
            console.log('📍 Selected frontend mode (user must provide key)');
        }
    }

    /**
     * Switch mode manually
     */
    async switchMode(newMode) {
        if (newMode !== 'backend' && newMode !== 'frontend') {
            throw new Error('Invalid mode. Must be "backend" or "frontend".');
        }

        // Validate mode is available
        if (newMode === 'backend' && !this.backendAvailable) {
            throw new Error('Backend mode not available. Server not running or API key not configured.');
        }

        if (newMode === 'frontend' && !this.frontendKeyAvailable) {
            throw new Error('Frontend mode not available. Please configure your API key first.');
        }

        this.mode = newMode;
        console.log(`🔄 Switched to ${newMode} mode`);
        this.updateUIIndicator();

        return { success: true, mode: this.mode };
    }

    /**
     * Call Gemini API using current mode
     */
    async callGeminiAPI(prompt, files = []) {
        if (!this.initialized) {
            await this.initialize();
        }

        // Validate API is ready
        if (!this.isReady()) {
            throw new Error('API not ready. Please configure API key or start backend server.');
        }

        // Track usage
        this.usage.requests++;
        this.usage.lastRequest = new Date();

        try {
            let result;

            if (this.mode === 'backend') {
                result = await this.callBackendAPI(prompt, files);
            } else {
                result = await this.callFrontendAPI(prompt, files);
            }

            return result;

        } catch (error) {
            this.usage.errors++;

            // Auto-fallback if backend fails and frontend is available
            if (this.mode === 'backend' && this.frontendKeyAvailable) {
                console.warn('⚠️ Backend API failed, attempting frontend fallback...');
                try {
                    const fallbackResult = await this.callFrontendAPI(prompt, files);
                    console.log('✅ Frontend fallback successful');
                    return fallbackResult;
                } catch (fallbackError) {
                    console.error('❌ Frontend fallback also failed');
                    throw error; // Throw original error
                }
            }

            throw error;
        }
    }

    /**
     * Call backend API (server proxies to Gemini)
     */
    async callBackendAPI(prompt, files = []) {
        const url = `${this.config.backend.baseUrl}${this.config.backend.endpoints.analyze}`;

        console.log('📡 Calling backend API...');

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt,
                files,
                model: this.config.gemini.model,
                temperature: this.config.gemini.temperature,
                maxTokens: this.config.gemini.maxTokens
            }),
            signal: AbortSignal.timeout(this.config.gemini.timeout)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Backend API error: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Call frontend API (direct to Gemini with user's key)
     */
    async callFrontendAPI(prompt, files = []) {
        const apiKey = localStorage.getItem('gemini_api_key');

        if (!apiKey || !apiKey.startsWith('AIza')) {
            throw new Error('Valid API key not found in localStorage');
        }

        console.log('📡 Calling Gemini API directly...');

        const url = `${this.config.gemini.baseUrl}/${this.config.gemini.model}:generateContent?key=${apiKey}`;

        // Prepare request body
        const parts = [{ text: prompt }];

        if (files && files.length > 0) {
            files.forEach(file => {
                if (file.mimeType === 'application/pdf') {
                    parts.push({
                        inlineData: {
                            mimeType: file.mimeType,
                            data: file.data
                        }
                    });
                }
            });
        }

        const requestBody = {
            contents: [{ parts }],
            generationConfig: {
                temperature: this.config.gemini.temperature,
                maxOutputTokens: this.config.gemini.maxTokens,
                topP: 0.95,
                topK: 40
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            signal: AbortSignal.timeout(this.config.gemini.timeout)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `Gemini API error: ${response.status}`);
        }

        const data = await response.json();

        // Extract text from Gemini response
        if (data.candidates && data.candidates[0]?.content?.parts) {
            const text = data.candidates[0].content.parts[0].text;
            return {
                success: true,
                data: { text }
            };
        } else {
            throw new Error('Unexpected response format from Gemini API');
        }
    }

    /**
     * Check if API is ready to use
     */
    isReady() {
        if (this.mode === 'backend') {
            return this.backendAvailable;
        } else {
            return this.frontendKeyAvailable;
        }
    }

    /**
     * Get current status
     */
    getStatus() {
        return {
            initialized: this.initialized,
            environment: this.environment,
            apiProvider: this.apiProvider,
            mode: this.mode,
            ready: this.isReady(),
            backendAvailable: this.backendAvailable,
            frontendKeyAvailable: this.frontendKeyAvailable,
            usage: this.usage
        };
    }

    /**
     * Validate API key (frontend mode)
     */
    async validateAPIKey(apiKey) {
        if (!apiKey || !apiKey.startsWith('AIza')) {
            return {
                valid: false,
                error: 'Invalid API key format. Should start with "AIza"'
            };
        }

        if (apiKey.length < 30) {
            return {
                valid: false,
                error: 'API key too short'
            };
        }

        // Test API key with a simple request
        try {
            const url = `${this.config.gemini.baseUrl}/${this.config.gemini.model}:generateContent?key=${apiKey}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: 'Test connection' }]
                    }],
                    generationConfig: {
                        maxOutputTokens: 10
                    }
                }),
                signal: AbortSignal.timeout(10000)
            });

            if (response.ok) {
                return {
                    valid: true,
                    message: 'API key validated successfully'
                };
            } else {
                const errorData = await response.json();
                return {
                    valid: false,
                    error: errorData.error?.message || 'API key validation failed'
                };
            }

        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }

    /**
     * Update UI indicator
     */
    updateUIIndicator() {
        const indicator = document.getElementById('api-mode-indicator');
        if (indicator) {
            const envIcon = this.environment === 'production' ? '🌍' : '🧪';
            const envText = this.environment?.toUpperCase() || 'UNKNOWN';
            const providerText = this.apiProvider === 'gemini' ? 'Gemini' : 'OpenRouter';
            const modeText = this.mode === 'backend' ? '🔒 Backend' : '🔑 Frontend';
            const statusText = this.isReady() ? 'Ready' : 'Not Ready';
            const statusClass = this.isReady() ? 'status-ready' : 'status-not-ready';

            indicator.innerHTML = `
                <span class="mode-badge ${statusClass}">
                    ${envIcon} ${envText} | ${providerText} | ${modeText} - ${statusText}
                </span>
            `;
        }
    }

    /**
     * Get usage statistics
     */
    getUsageStats() {
        return {
            ...this.usage,
            successRate: this.usage.requests > 0
                ? ((this.usage.requests - this.usage.errors) / this.usage.requests * 100).toFixed(2) + '%'
                : 'N/A'
        };
    }
}

// Create global instance
const smartAPIConfig = new SmartAPIConfig();

// Auto-initialize on page load
if (typeof window !== 'undefined') {
    window.smartAPIConfig = smartAPIConfig;

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            smartAPIConfig.initialize();
        });
    } else {
        smartAPIConfig.initialize();
    }
}

// Backward compatibility: expose as callGeminiAPI
window.callGeminiAPI = (prompt, files) => smartAPIConfig.callGeminiAPI(prompt, files);
window.API_CONFIG = smartAPIConfig;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SmartAPIConfig, smartAPIConfig };
}
