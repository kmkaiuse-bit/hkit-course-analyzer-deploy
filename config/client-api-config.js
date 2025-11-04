/**
 * Client-side API Configuration
 * For large PDFs that bypass Vercel's 4.5MB limit
 *
 * SETUP: Replace YOUR_NEW_API_KEY with your actual Gemini API key
 * Get your key at: https://aistudio.google.com/app/apikey
 *
 * SECURITY: This file is in .gitignore and should NOT be committed to GitHub
 */

const CLIENT_API_CONFIG = {
    // Your Gemini API key (for large PDF direct calls)
    // Replace with your actual key from https://aistudio.google.com/app/apikey
    GEMINI_API_KEY: 'YOUR_NEW_API_KEY', // TODO: Replace with your new API key

    // API endpoint
    GEMINI_API_ENDPOINT: 'https://generativelanguage.googleapis.com/v1/models',

    // Model configuration
    MODEL: 'gemini-2.5-pro',
    TEMPERATURE: 0.3,
    MAX_OUTPUT_TOKENS: 16384
};

// Make available globally
window.CLIENT_API_CONFIG = CLIENT_API_CONFIG;
