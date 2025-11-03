# SQLite Database Quick Start

Get your SQLite database up and running in 5 minutes!

## Prerequisites

- Node.js installed
- Your project cloned/downloaded

## Step 1: Install Dependencies

```bash
npm install
```

This installs `sqlite3` and other required packages.

## Step 2: Create Database

```bash
npm run db:setup
```

This creates `exemption_data.db` with all tables, indexes, and sample data.

**Output:**
```
✅ Database opened
✅ Schema created successfully
📊 Tables created:
   - analysis_results
   - audit_log
   - decision_history
   - exemption_patterns
📈 Database Statistics:
   Patterns: 5
   Analyses: 0
💾 Database Size: 0.02 MB
✅ Setup completed successfully!
```

## Step 3: Test Database

```bash
npm run db:test
```

Runs comprehensive tests to verify everything works.

**Expected:** All 9 tests should pass ✅

## Step 4: Start Using!

Your database is ready! The file `exemption_data.db` now exists in your project root.

### Option A: Use with Express Server

Update `server/learning-server.js`:

```javascript
// Change line 16 from:
const dbConnection = require('../local/assets/js/db/connection');

// To:
const dbConnection = require('../local/assets/js/db/connection-sqlite');
```

Then start the server:
```bash
npm start
```

### Option B: Use Directly in Your Code

```javascript
const dbConnection = require('./local/assets/js/db/connection-sqlite');

// Connect
await dbConnection.connect();

// Query
const patterns = await dbConnection.query('SELECT * FROM exemption_patterns');
console.log(patterns.rows);

// Insert
await dbConnection.run(
  'INSERT INTO exemption_patterns (...) VALUES (...)',
  [values]
);
```

## Backup Your Database

Run anytime:
```bash
npm run db:backup
```

Creates timestamped backup in `backups/` folder.

## View Your Data

### Method 1: SQLite Browser
Download free tool: https://sqlitebrowser.org/

Open `exemption_data.db` to view/edit data with a GUI.

### Method 2: Command Line
```bash
sqlite3 exemption_data.db

# Inside sqlite3:
.tables                    # List tables
SELECT * FROM exemption_patterns;  # Query data
.quit                      # Exit
```

### Method 3: VS Code Extension
Install "SQLite Viewer" extension in VS Code.
Right-click `exemption_data.db` → "Open Database"

## Common Commands

```bash
# Setup fresh database
npm run db:setup

# Test database
npm run db:test

# Create backup
npm run db:backup

# Migrate from PostgreSQL
npm run db:migrate
```

## Database Location

The database file is located at:
```
<project-root>/exemption_data.db
```

Backups are stored in:
```
<project-root>/backups/exemption_data_YYYY-MM-DD.db
```

## What's Inside?

### Tables
1. **exemption_patterns** - Learning patterns (HKIT course → Previous subject)
2. **decision_history** - Individual decision tracking
3. **analysis_results** - Complete analysis sessions ⭐ NEW!
4. **audit_log** - Change tracking

### Views (Pre-built Queries)
- `pattern_analysis` - Enriched pattern data
- `recent_analyses` - Recent analysis sessions
- `learning_stats` - System-wide statistics

### Sample Data
The setup includes 5 sample patterns for testing:
- HD401: English Language
- HD402: Communication Skills
- HD403: Mathematics
- IT101: Computer Fundamentals
- BM301: Business Management

## Next Steps

1. ✅ Database is set up
2. Update your code to use SQLite connection
3. Test your application end-to-end
4. Set up automated backups (see SQLITE_MIGRATION_GUIDE.md)
5. Start analyzing transcripts!

## Need Help?

- **Full Guide**: See `db/SQLITE_MIGRATION_GUIDE.md`
- **Schema Details**: See `db/migrations/001_create_sqlite_schema.sql`
- **Test Issues**: Run `npm run db:test` and check output

## Troubleshooting

### "Cannot find module 'sqlite3'"
Run: `npm install`

### "Database is locked"
Close any SQLite browser/viewer tools and try again.

### "Permission denied"
Check file permissions on `exemption_data.db` and ensure you have write access.

### Database file doesn't exist
Run: `npm run db:setup`

---

**You're all set! 🎉**

The SQLite database is now ready to store:
- Learning patterns (for improving AI accuracy)
- Complete analysis results (for record-keeping)
- Decision history (for time-weighted confidence)
- Audit logs (for tracking changes)

Start analyzing transcripts and the system will automatically learn and improve! 📚🤖
