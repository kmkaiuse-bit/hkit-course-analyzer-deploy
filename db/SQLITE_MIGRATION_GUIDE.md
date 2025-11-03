# SQLite Migration Guide
## Migrating from PostgreSQL to SQLite

This guide helps you migrate from PostgreSQL to SQLite for easier solo management.

---

## Why SQLite?

✅ **Zero server management** - Just a single file
✅ **Easy backups** - Simple file copy
✅ **Portable** - Move anywhere
✅ **No credentials** - No complex setup
✅ **Perfect for solo projects**

---

## Prerequisites

1. Node.js installed
2. Install SQLite3 package:
```bash
npm install sqlite3
```

---

## Migration Steps

### Step 1: Backup PostgreSQL Data (Optional but Recommended)

If you have existing data in PostgreSQL:

```bash
# Export PostgreSQL data
pg_dump -U hkit_admin -d hkit_learning_db > backups/postgres_backup.sql
```

### Step 2: Initialize SQLite Database

Run the setup script to create a fresh SQLite database:

```bash
node scripts/setup-sqlite.js
```

This will:
- Create `exemption_data.db` in your project root
- Set up all tables (exemption_patterns, decision_history, analysis_results, audit_log)
- Create indexes and triggers
- Insert sample data for testing

### Step 3: Migrate Existing Data (If You Have PostgreSQL Data)

If you have existing data in PostgreSQL that you want to migrate:

```bash
node db/migrations/migrate_postgres_to_sqlite.js
```

This script will:
- Connect to your PostgreSQL database (using `.env` credentials)
- Export all patterns and decision history
- Import into SQLite with proper ID mapping
- Verify data integrity
- Create a backup

**Note:** Make sure your `.env` file has PostgreSQL credentials if migrating data.

### Step 4: Update Your Code

Replace PostgreSQL connection with SQLite connection:

**Old (PostgreSQL):**
```javascript
const dbConnection = require('./local/assets/js/db/connection');
```

**New (SQLite):**
```javascript
const dbConnection = require('./local/assets/js/db/connection-sqlite');
```

The API remains the same, so most of your code doesn't need to change!

### Step 5: Test the Database

Run tests to verify everything works:

```bash
node scripts/test-sqlite.js
```

This will test:
- Database connection
- Health checks
- CRUD operations
- Transactions
- Views
- All tables

### Step 6: Update Server Configuration (Optional)

If you're using the Express server, you can keep it running. The SQLite connection module is API-compatible with the PostgreSQL one, so the server code doesn't need changes.

Just update the require path in `server/learning-server.js`:

```javascript
// Change this line:
const dbConnection = require('../local/assets/js/db/connection');

// To this:
const dbConnection = require('../local/assets/js/db/connection-sqlite');
```

---

## Database Management

### Backup Database

Create a backup anytime:

```bash
node scripts/backup-sqlite.js
```

Backups are stored in the `backups/` directory with timestamps.

**Manual backup (even simpler):**
```bash
# Windows
copy exemption_data.db backups\exemption_data_%date:~-4,4%%date:~-10,2%%date:~-7,2%.db

# Linux/Mac
cp exemption_data.db backups/exemption_data_$(date +%Y%m%d).db
```

### Restore from Backup

```bash
# Windows
copy backups\exemption_data_2025-11-03.db exemption_data.db

# Linux/Mac
cp backups/exemption_data_2025-11-03.db exemption_data.db
```

### View Database Content

Use any SQLite browser:
- **DB Browser for SQLite** (free, cross-platform): https://sqlitebrowser.org/
- **VS Code Extension**: SQLite Viewer
- **Command line**: `sqlite3 exemption_data.db`

### Optimize Database

Run vacuum to compact the database:

```bash
sqlite3 exemption_data.db "VACUUM;"
```

Or use the built-in method:
```javascript
await dbConnection.vacuum();
```

---

## Database Schema

### Tables

1. **exemption_patterns** - Learning patterns for AI improvement
2. **decision_history** - Individual decision tracking
3. **analysis_results** - Complete analysis sessions (NEW!)
4. **audit_log** - Change tracking

### Key Features

- ✅ Foreign key constraints enabled
- ✅ Automatic timestamp updates via triggers
- ✅ Automatic exemption_rate calculation
- ✅ Built-in views for common queries
- ✅ Audit trail for pattern changes

---

## Common Operations

### Query Patterns

```javascript
// Get all patterns
const patterns = await dbConnection.query('SELECT * FROM exemption_patterns');

// Get single pattern
const pattern = await dbConnection.queryOne('SELECT * FROM exemption_patterns WHERE id = ?', [1]);

// Insert pattern
const result = await dbConnection.run(
  'INSERT INTO exemption_patterns (hkit_subject, previous_subject, ...) VALUES (?, ?, ...)',
  [values]
);
console.log('Inserted ID:', result.lastID);

// Update pattern
await dbConnection.run('UPDATE exemption_patterns SET confidence = ? WHERE id = ?', [0.95, 1]);

// Use views
const stats = await dbConnection.queryOne('SELECT * FROM learning_stats');
```

### Save Analysis Results (NEW!)

```javascript
await dbConnection.run(`
  INSERT INTO analysis_results (
    programme_code, programme_name,
    transcript_subjects, exemption_results,
    total_subjects_analyzed, total_exemptions_granted,
    total_exemptions_rejected
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`, [
  'BEng(CS)',
  'Bachelor of Engineering in Computer Science',
  JSON.stringify(transcriptSubjects),
  JSON.stringify(exemptionResults),
  15, 8, 7
]);
```

### Query Analysis History (NEW!)

```javascript
// Recent analyses
const recent = await dbConnection.query(`
  SELECT * FROM recent_analyses LIMIT 20
`);

// Find by programme
const byProgramme = await dbConnection.query(`
  SELECT * FROM analysis_results
  WHERE programme_code = ?
  ORDER BY analysis_date DESC
`, ['BEng(CS)']);

// Monthly summary
const monthly = await dbConnection.query(`
  SELECT
    strftime('%Y-%m', analysis_date) as month,
    COUNT(*) as analyses_count,
    SUM(total_exemptions_granted) as total_exemptions
  FROM analysis_results
  GROUP BY month
  ORDER BY month DESC
`);
```

---

## Troubleshooting

### "Database is locked"
- SQLite doesn't handle multiple concurrent writes well
- Solution: Keep the Express server as the single point of access
- Or: Use `PRAGMA busy_timeout = 5000;` for longer waits

### "FOREIGN KEY constraint failed"
- Foreign keys are enabled by default
- Make sure parent records exist before inserting child records

### "Unable to open database file"
- Check file permissions
- Ensure the path exists
- On Windows, use absolute paths or double backslashes

### Database file too large
- Run `VACUUM` to compact
- Archive old `analysis_results` records
- Set up data retention policies

---

## Performance Tips

1. **Use transactions for bulk inserts**:
```javascript
await dbConnection.transaction(async (db) => {
  for (const item of items) {
    await db.run('INSERT INTO ...', [values]);
  }
});
```

2. **Use prepared statements** (already built into connection module)

3. **Regular VACUUM** - Run monthly to keep database compact

4. **Index usage** - All common query fields are indexed

---

## Automated Backups

### Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Trigger: Daily at 2:00 AM
4. Action: Start a program
5. Program: `node`
6. Arguments: `C:\path\to\project\scripts\backup-sqlite.js`
7. Start in: `C:\path\to\project`

### Linux/Mac Cron Job

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 2:00 AM)
0 2 * * * cd /path/to/project && node scripts/backup-sqlite.js
```

---

## Migration Checklist

- [ ] Install sqlite3 package
- [ ] Run setup-sqlite.js
- [ ] Migrate data (if applicable)
- [ ] Update connection imports
- [ ] Test with test-sqlite.js
- [ ] Update server (if using Express)
- [ ] Set up automated backups
- [ ] Verify application works end-to-end
- [ ] Archive PostgreSQL data (optional)
- [ ] Decommission PostgreSQL (optional)

---

## Support

For issues or questions:
1. Check the logs in console
2. Verify database file exists and has correct permissions
3. Test with `scripts/test-sqlite.js`
4. Check SQLite documentation: https://www.sqlite.org/docs.html

---

## Comparison: PostgreSQL vs SQLite

| Feature | PostgreSQL | SQLite |
|---------|-----------|---------|
| Setup | Server installation required | Single file |
| Backup | pg_dump command | File copy |
| Management | psql, pgAdmin | Any SQLite tool |
| Credentials | Username/password | None |
| Concurrent Writes | Excellent | Limited |
| Best For | Multi-user, high traffic | Solo, low-medium traffic |

For your solo-managed project, SQLite is the better choice! 🎉
