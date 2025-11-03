/**
 * Supabase Configuration
 * Store your Supabase project credentials here
 *
 * IMPORTANT:
 * - Get these values from your Supabase Dashboard
 * - Do NOT commit this file with real credentials to public repositories
 * - For production, use environment variables
 */

const SUPABASE_CONFIG = {
    // Your Supabase project URL
    // Found in: Supabase Dashboard → Settings → API → Project URL
    url: 'https://hainmitjatzhapayubtg.supabase.co',

    // Your Supabase anon/public key
    // Found in: Supabase Dashboard → Settings → API → Project API keys → anon public
    // This key is safe to use in the browser
    //
    // REPLACE THIS WITH YOUR ACTUAL KEY:
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhaW5taXRqYXR6aGFwYXl1YnRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNTQ5OTksImV4cCI6MjA3NzczMDk5OX0.T1tVLGQpcDmUYcVGSWu5BiGIYLoxkHb9D5OlYKy9TIM',

    // Optional: Enable/disable cloud sync
    enabled: true,

    // Auto-detect from Vercel environment variables (if available)
    getConfig() {
        // Try to use environment variables first (for Vercel deployment)
        const envUrl = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL;
        const envKey = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        return {
            url: envUrl || this.url,
            anonKey: envKey || this.anonKey,
            enabled: this.enabled && (envKey || this.anonKey !== 'YOUR_SUPABASE_ANON_KEY_HERE')
        };
    }
};

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.SUPABASE_CONFIG = SUPABASE_CONFIG;
}

