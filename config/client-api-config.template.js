/**
 * Client-side API Configuration Template
 *
 * SETUP INSTRUCTIONS:
 * 1. Copy this file to: client-api-config.js
 * 2. Get your API key from: https://aistudio.google.com/app/apikey
 * 3. Replace YOUR_API_KEY_HERE with your actual key
 *
 * SECURITY WARNING:
 * - client-api-config.js is in .gitignore and should NOT be committed
 * - This API key will be visible in the browser
 * - Only use for development or small deployments
 * - For production, use Vercel environment variables instead
 */

const CLIENT_API_CONFIG = {
    // Your Gemini API key (for large PDF direct calls)
    // Replace with your actual key from https://aistudio.google.com/app/apikey
    GEMINI_API_KEY: 'YOUR_API_KEY_HERE', // Example: 'AIzaSyABC...'

    // API endpoint (don't change)
    GEMINI_API_ENDPOINT: 'https://generativelanguage.googleapis.com/v1/models',

    // Model configuration
    MODEL: 'gemini-2.5-pro',
    TEMPERATURE: 0.3,
    MAX_OUTPUT_TOKENS: 16384
};

// Make available globally
window.CLIENT_API_CONFIG = CLIENT_API_CONFIG;
