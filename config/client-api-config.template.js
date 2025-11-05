/**
 * Client-side API Configuration Template - TESTING ENVIRONMENT ONLY
 *
 * ⚠️ ENVIRONMENT: TESTING/LOCAL DEVELOPMENT ONLY
 * DO NOT use this configuration in production
 *
 * SETUP INSTRUCTIONS:
 * 1. Copy this file to: config/client-api-config.js
 * 2. Choose your provider (Gemini or OpenRouter)
 * 3. Replace placeholder with your actual API key:
 *    - Gemini: https://aistudio.google.com/app/apikey
 *    - OpenRouter: https://openrouter.ai/keys
 *
 * SECURITY WARNING:
 * - client-api-config.js is in .gitignore and should NOT be committed
 * - These API keys will be visible in the browser
 * - Only use for development or testing
 * - For production, use server-side environment variables (.env)
 *
 * ENVIRONMENT SEPARATION:
 * - Production: Uses Gemini via Vercel Functions (server-side keys)
 * - Testing: Uses this file for OpenRouter experiments (local only)
 */

const CLIENT_API_CONFIG = {
    // === GEMINI API (Production Provider) ===
    GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY_HERE', // Example: 'AIzaSyABC...'
    GEMINI_API_ENDPOINT: 'https://generativelanguage.googleapis.com/v1/models',

    // === OPENROUTER API (Testing Provider) ===
    OPENROUTER_API_KEY: 'YOUR_OPENROUTER_API_KEY_HERE', // Example: 'sk-or-v1-...'

    // Model configuration (adjust based on your provider)
    MODEL: 'google/gemini-2.5-pro', // For OpenRouter, or 'gemini-2.5-pro' for Gemini
    TEMPERATURE: 0.3,
    MAX_OUTPUT_TOKENS: 16384
};

// Make available globally
window.CLIENT_API_CONFIG = CLIENT_API_CONFIG;
