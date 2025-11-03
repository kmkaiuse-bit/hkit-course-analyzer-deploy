# How to Get Your Supabase Anon Key

## Quick Steps (2 minutes)

1. **Go to Supabase Dashboard**
   ```
   https://supabase.com/dashboard
   ```

2. **Select Your Project**
   - Click on: `hainmitjatzhapayubtg` (your project)

3. **Go to Settings → API**
   - Click **Settings** (⚙️ icon, bottom left)
   - Click **API** in the settings menu

4. **Copy the Anon Key**
   - Scroll to **Project API keys** section
   - Find **anon** / **public** key
   - Click the **Copy** button (📋)

5. **Paste into Config File**
   - Open: `local/config/supabase-config.js`
   - Replace `'YOUR_SUPABASE_ANON_KEY_HERE'` with your actual key
   - Save the file

## Example

Your anon key looks like:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhaW5taXRqYXR6aGFwYXl1YnRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA2MjUxMjcsImV4cCI6MjA0NjIwMTEyN30...
```

## Security Note

✅ **Safe to use in browser**: The `anon` key is public and safe for frontend use
✅ **Supabase RLS**: Row Level Security policies protect your data
❌ **DO NOT share**: The `service_role` key (keep it secret!)

## After Adding the Key

Run your app and check the console:
- ✅ "Supabase client initialized successfully" = Working!
- ❌ Error message = Check the key is correct
