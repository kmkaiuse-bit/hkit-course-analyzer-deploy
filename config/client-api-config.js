/**
 * Client-side API Configuration
 * For large PDFs that bypass Vercel's 4.5MB limit
 *
 * IMPORTANT: This API key will be visible in the browser.
 * For better security, use Vercel environment variables when possible.
 */

const CLIENT_API_CONFIG = {
    // Your Gemini API key (for large PDF direct calls)
    // Leave empty to require users to enter their own key
    // Or add your key here to let all users use your key
    // Get your key at: https://aistudio.google.com/app/apikey
    GEMINI_API_KEY: 'AIzaSyC9X2LHsLQXxCXpwQFNd41I6xrLpvLEJAc', // TODO: Add your key here: 'AIzaSy...'

    // API endpoint
    GEMINI_API_ENDPOINT: 'https://generativelanguage.googleapis.com/v1/models',

    // Model configuration
    MODEL: 'gemini-2.5-pro',
    TEMPERATURE: 0.3,
    MAX_OUTPUT_TOKENS: 16384
};

// Make available globally
window.CLIENT_API_CONFIG = CLIENT_API_CONFIG;
