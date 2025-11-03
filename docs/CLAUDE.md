# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Project Overview
HKIT Course Analyzer - A web application for analyzing HKIT course transcripts and determining exemption eligibility for university programs using Google Gemini AI.

## Tech Stack
- Frontend: Vanilla JavaScript, HTML5, CSS3
- PDF Processing: PDF.js
- AI Analysis: Google Gemini API (gemini-1.5-flash)
- Learning Database: PostgreSQL 17 + Express.js API
- Deployment: Vercel Functions (serverless) + Local Express Server

## Key Files
### Production
- `index.html` - Main production app (Vercel Functions)
- `api/gemini.js` - Main Gemini API proxy endpoint

### Local Development (Recommended)
- `local/enhanced.html` - Full-featured local version with learning database
- `local/assets/js/gemini-api.js` - API integration with smart pattern matching
- `local/assets/js/smart-pattern-matcher.js` - NEW: Auto-applies high-confidence patterns

### Learning Database System
- `server/learning-server.js` - Express.js API server (localhost:3001)
- `local/assets/js/learning-client.js` - Browser API client
- `local/assets/js/db/` - Database modules (connection, recorder, retriever)

## Development Commands

### Start Learning System
```bash
# Start PostgreSQL API server + Web server
npm run server  # localhost:3001
python -m http.server 8000  # localhost:8000
# Access: http://localhost:8000/local/enhanced.html
```

### Database Management
```bash
node view-database-data.js     # View patterns
node export-database.js       # Export CSV  
node clear-database.js        # Clear all data
```

## Environment Variables

### Production (Vercel)
- No environment variables required - API key configured in application code

### Local (.env file)
```env
# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hkit_learning_db
DB_USER=hkit_admin
DB_PASSWORD=hkit123

# Learning System
LEARNING_ENABLED=true
LEARNING_SERVER_PORT=3001
```

## Smart Pattern Matching System (NEW)

### How It Works
1. **Extract subjects** from transcript (regex patterns)
2. **Check database** for matching patterns with confidence scores
3. **Auto-apply** patterns >90% confidence (no AI needed)
4. **Send hints** to AI for 50-90% confidence patterns
5. **Let AI decide** freely for <50% confidence patterns

### Benefits
- 50-70% fewer tokens sent to AI
- Faster processing (less AI analysis needed)
- Consistent results for high-confidence patterns
- Learning improves over time

### Configuration (smart-pattern-matcher.js)
```javascript
config: {
    AUTO_APPLY_THRESHOLD: 0.90,    // Auto-apply >90%
    STRONG_HINT_THRESHOLD: 0.70,   // Strong hints 70-90%
    WEAK_HINT_THRESHOLD: 0.50,     // Weak hints 50-70%
    MIN_SAMPLE_SIZE: 2,            // Min observations for auto-apply
    MAX_PATTERNS_IN_PROMPT: 15     // Limit patterns in AI prompt
}
```

## Time-Weighted Confidence
- **Daily retention factor**: 0.99 (99% weight retained per day)
- **Formula**: `weight = 0.99^days_since_decision`
- Recent decisions carry more weight than historical ones

## Common Tasks

### Adding New University Programme
1. Edit `assets/js/templates.js`
2. Add programme object to `programmes` array
3. Programme appears automatically in UI

### Modifying Exemption Logic
- Edit prompt in `assets/js/gemini-api.js:createPrompt()`
- Key criteria: 50% max exemptions, language course rules, pass grades

### Manual Database Save
- Click "💾 Save to Database" button after analysis
- Preview shows valid vs invalid patterns
- Only saves patterns with non-empty "Subject Name of Previous Studies"

### Learning Dashboard
- Click learning status badge or press Ctrl+Shift+L
- Shows pattern statistics and confidence metrics
- Real-time connection status

## Current System Status (December 2025)
- ✅ Smart pattern matching with auto-apply functionality
- ✅ Time-weighted confidence system (0.99 daily retention)
- ✅ Manual database save with preview
- ✅ PostgreSQL database integration
- ✅ Express.js API server for learning patterns
- ✅ Browser-compatible learning client
- ✅ Token-optimized AI prompts

## Troubleshooting

### Learning System Issues
- Check `npm run server` is running on port 3001
- Verify `.env` file has correct PostgreSQL credentials
- Check browser console for connection errors

### Pattern Matching Not Working
- Ensure `smart-pattern-matcher.js` is loaded before `gemini-api.js`
- Check console for "Smart Pattern Results" messages
- Verify patterns exist in database with sufficient confidence

### Database Connection Issues
- Check PostgreSQL service is running
- Test connection: `psql -U hkit_admin -d hkit_learning_db`
- Check credentials in `.env` file

## Database Schema

### exemption_patterns
- `previous_subject` - Course name from transcript
- `hkit_subject` - Mapped HKIT course code
- `confidence` - Traditional confidence score
- `weighted_confidence` - Time-weighted confidence
- `exemption_rate` - Percentage of exemptions granted
- `times_seen` - Total observations
- `programme_context` - Programme code context

### decision_history
- References exemption_patterns for time-weighting
- Tracks individual decisions with timestamps
- Used for confidence decay calculation